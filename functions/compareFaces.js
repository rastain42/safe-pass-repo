const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { ImageAnnotatorClient } = require("@google-cloud/vision");
const { getStorage } = require("firebase-admin/storage");
const admin = require("firebase-admin");

// Initialize Vision API client
const visionClient = new ImageAnnotatorClient({
  // Utilise les credentials par défaut de Firebase
});

/**
 * Fonction Firebase pour comparer deux visages
 */
const compareFaces = onCall(async (request) => {
  console.log("=== Face Comparison Start ===");
  console.log("User UID:", request.auth?.uid);

  // Vérifier l'authentification
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Non authentifié");
  }

  const { documentImageUri, selfieImageUri, userId } = request.data;

  if (!documentImageUri || !selfieImageUri || !userId) {
    throw new HttpsError("invalid-argument", "Paramètres manquants");
  }

  try {
    const bucket = getStorage().bucket();

    // Télécharger les deux images
    console.log("Téléchargement des images...");
    console.log("Document URI:", documentImageUri);
    console.log("Selfie URI:", selfieImageUri);

    // Extraire les chemins depuis les URIs (support HTTP et gs://)
    let docPath, selfiePath;

    if (documentImageUri.includes("gs://")) {
      docPath = documentImageUri
        .replace("gs://", "")
        .replace(`${bucket.name}/`, "");
    } else if (
      documentImageUri.includes("firebasestorage.googleapis.com") ||
      documentImageUri.includes("firebasestorage.app")
    ) {
      // Extraire le chemin depuis l'URL HTTP Firebase Storage
      const docUrl = new URL(documentImageUri);
      docPath = decodeURIComponent(
        docUrl.pathname.split("/o/")[1].split("?")[0]
      );
    } else {
      docPath = documentImageUri;
    }

    if (selfieImageUri.includes("gs://")) {
      selfiePath = selfieImageUri
        .replace("gs://", "")
        .replace(`${bucket.name}/`, "");
    } else if (
      selfieImageUri.includes("firebasestorage.googleapis.com") ||
      selfieImageUri.includes("firebasestorage.app")
    ) {
      // Extraire le chemin depuis l'URL HTTP Firebase Storage
      const selfieUrl = new URL(selfieImageUri);
      selfiePath = decodeURIComponent(
        selfieUrl.pathname.split("/o/")[1].split("?")[0]
      );
    } else {
      selfiePath = selfieImageUri;
    }

    console.log("Chemins extraits - Document:", docPath, "Selfie:", selfiePath);

    const [docBuffer] = await bucket.file(docPath).download();
    const [selfieBuffer] = await bucket.file(selfiePath).download();

    console.log(
      "Images téléchargées, tailles:",
      docBuffer.length,
      selfieBuffer.length
    );

    // Analyser les visages dans les deux images
    console.log("Détection des visages...");

    const [docFaceDetection] = await visionClient.faceDetection({
      image: { content: docBuffer.toString("base64") },
    });

    const [selfieFaceDetection] = await visionClient.faceDetection({
      image: { content: selfieBuffer.toString("base64") },
    });

    const docFaces = docFaceDetection.faceAnnotations || [];
    const selfieFaces = selfieFaceDetection.faceAnnotations || [];

    console.log(
      `Visages détectés - Document: ${docFaces.length}, Selfie: ${selfieFaces.length}`
    );

    // Vérifier qu'il y a exactement un visage dans chaque image
    if (docFaces.length === 0) {
      return {
        success: false,
        match: false,
        confidence: 0,
        similarityScore: 0,
        error: "Aucun visage détecté dans le document",
        details: {
          faceDetectedInDocument: false,
          faceDetectedInSelfie: selfieFaces.length > 0,
          qualityScore: 0,
        },
      };
    }

    if (selfieFaces.length === 0) {
      return {
        success: false,
        match: false,
        confidence: 0,
        similarityScore: 0,
        error: "Aucun visage détecté dans le selfie",
        details: {
          faceDetectedInDocument: true,
          faceDetectedInSelfie: false,
          qualityScore: 0,
        },
      };
    }

    if (docFaces.length > 1 || selfieFaces.length > 1) {
      return {
        success: false,
        match: false,
        confidence: 0,
        similarityScore: 0,
        error: "Plusieurs visages détectés - un seul visage requis par image",
        details: {
          faceDetectedInDocument: docFaces.length === 1,
          faceDetectedInSelfie: selfieFaces.length === 1,
          qualityScore: 0,
        },
      };
    }

    // Analyser la qualité des visages détectés
    const docFace = docFaces[0];
    const selfieFace = selfieFaces[0];

    // Calculer les scores de qualité basés sur la détection
    const docQuality = calculateFaceQuality(docFace);
    const selfieQuality = calculateFaceQuality(selfieFace);
    const averageQuality = (docQuality + selfieQuality) / 2;

    console.log(
      `Qualité des visages - Document: ${docQuality}, Selfie: ${selfieQuality}`
    ); // Comparer les caractéristiques faciales
    const similarityScore = compareFaceFeatures(docFace, selfieFace);

    // Seuils ajustés pour photo de carte d'identité vs selfie
    const highConfidenceThreshold = 0.65; // Score élevé pour un match certain
    const lowConfidenceThreshold = 0.45; // Score minimum pour un match possible

    // Système de décision à trois niveaux
    let matchDecision = "uncertain";
    let confidence = 0;

    if (similarityScore >= highConfidenceThreshold) {
      matchDecision = "match";
      confidence = Math.min(
        0.85 + (similarityScore - highConfidenceThreshold) * 0.4,
        0.98
      );
    } else if (similarityScore >= lowConfidenceThreshold) {
      matchDecision = "possible_match";
      const range = highConfidenceThreshold - lowConfidenceThreshold;
      const position = (similarityScore - lowConfidenceThreshold) / range;
      confidence = 0.5 + position * 0.35; // Entre 50% et 85%
    } else {
      matchDecision = "no_match";
      confidence = Math.max(0.05, similarityScore * 0.5); // Confiance faible
    }

    // Ajustement basé sur la qualité moyenne
    const qualityBonus = Math.max(0, (averageQuality - 0.5) * 0.1);
    confidence = Math.min(confidence + qualityBonus, 0.98);

    const isMatch =
      matchDecision === "match" ||
      (matchDecision === "possible_match" && confidence >= 0.7);

    console.log(`=== RÉSULTAT FINAL ===`);
    console.log(`Score de similarité: ${(similarityScore * 100).toFixed(1)}%`);
    console.log(`Qualité moyenne: ${(averageQuality * 100).toFixed(1)}%`);
    console.log(`Décision: ${matchDecision}`);
    console.log(`Confiance: ${(confidence * 100).toFixed(1)}%`);
    console.log(`Match final: ${isMatch}`);
    console.log(`======================`);

    return {
      success: true,
      match: isMatch,
      confidence: confidence,
      similarityScore: similarityScore,
      details: {
        faceDetectedInDocument: true,
        faceDetectedInSelfie: true,
        qualityScore: averageQuality,
        matchDecision: matchDecision,
        thresholds: {
          high: highConfidenceThreshold,
          low: lowConfidenceThreshold,
        },
      },
    };
  } catch (error) {
    console.error("Erreur lors de la comparaison de visages:", error);
    throw new HttpsError("internal", `Erreur interne: ${error.message}`);
  }
});

/**
 * Calcule un score de qualité pour un visage détecté
 * Optimisé pour gérer à la fois selfies et photos de cartes d'identité
 */
function calculateFaceQuality(face) {
  let score = 0.3; // Score de base plus conservateur

  console.log("=== Calcul de qualité du visage ===");

  // Facteur principal : confiance de détection
  if (face.detectionConfidence) {
    const confidenceScore = face.detectionConfidence * 0.5; // Poids important
    score += confidenceScore;
    console.log(
      `Confiance de détection: ${face.detectionConfidence.toFixed(
        3
      )} -> +${confidenceScore.toFixed(3)}`
    );
  }

  // Orientation du visage (plus tolérant pour les cartes d'identité)
  let orientationBonus = 0;
  let orientationPenalties = [];

  if (face.rollAngle !== undefined) {
    const rollPenalty = Math.abs(face.rollAngle) / 45; // Normaliser sur 45°
    if (rollPenalty < 0.5) {
      // Moins de 22.5°
      orientationBonus += 0.1;
    } else {
      orientationPenalties.push(`roll: ${face.rollAngle.toFixed(1)}°`);
    }
  }

  if (face.panAngle !== undefined) {
    const panPenalty = Math.abs(face.panAngle) / 30; // Plus tolérant pour les cartes
    if (panPenalty < 0.7) {
      // Moins de 21°
      orientationBonus += 0.1;
    } else {
      orientationPenalties.push(`pan: ${face.panAngle.toFixed(1)}°`);
    }
  }

  if (face.tiltAngle !== undefined) {
    const tiltPenalty = Math.abs(face.tiltAngle) / 30;
    if (tiltPenalty < 0.7) {
      // Moins de 21°
      orientationBonus += 0.1;
    } else {
      orientationPenalties.push(`tilt: ${face.tiltAngle.toFixed(1)}°`);
    }
  }

  score += orientationBonus;
  console.log(`Bonus orientation: +${orientationBonus.toFixed(3)}`);
  if (orientationPenalties.length > 0) {
    console.log(`Pénalités orientation: ${orientationPenalties.join(", ")}`);
  }

  // Bonus pour les landmarks détectés (indicateur de qualité)
  if (face.landmarks && face.landmarks.length > 0) {
    const landmarkBonus = Math.min(face.landmarks.length / 30, 0.15); // Max 15% bonus
    score += landmarkBonus;
    console.log(
      `Landmarks détectés: ${face.landmarks.length} -> +${landmarkBonus.toFixed(
        3
      )}`
    );
  }

  // Émotions détectées (indicateur de bonne qualité d'image)
  if (face.joyLikelihood || face.sorrowLikelihood || face.angerLikelihood) {
    score += 0.05; // Petit bonus si les émotions sont détectées
    console.log("Émotions détectées -> +0.05");
  }

  const finalScore = Math.min(score, 1.0);
  console.log(`Score de qualité final: ${finalScore.toFixed(3)}`);

  return finalScore;
}

/**
 * Compare les caractéristiques faciales entre deux visages
 * Optimisé pour comparer photo de carte d'identité vs selfie
 */
function compareFaceFeatures(face1, face2) {
  console.log("=== Début de la comparaison des caractéristiques faciales ===");

  let totalScore = 0;
  let weightSum = 0;
  const scores = {};

  // 1. Score de base (deux visages détectés = déjà un bon début)
  const baseScore = 0.4;
  totalScore += baseScore * 1.0;
  weightSum += 1.0;
  scores.baseScore = baseScore;
  console.log("Score de base (détection):", baseScore);

  // 2. Comparer les ratios d'aspect des visages (plus tolérant)
  if (face1.boundingPoly && face2.boundingPoly) {
    const bbox1 = face1.boundingPoly.vertices;
    const bbox2 = face2.boundingPoly.vertices;

    if (bbox1 && bbox2 && bbox1.length >= 4 && bbox2.length >= 4) {
      const ratio1 = calculateAspectRatio(bbox1);
      const ratio2 = calculateAspectRatio(bbox2);

      // Plus tolérant pour les différences de ratio (carte vs selfie)
      const ratioDiff = Math.abs(ratio1 - ratio2);
      const maxRatio = Math.max(ratio1, ratio2);
      const ratioSimilarity = Math.max(0, 1 - (ratioDiff / maxRatio) * 0.5);

      totalScore += ratioSimilarity * 0.5;
      weightSum += 0.5;
      scores.ratioSimilarity = ratioSimilarity;
      console.log(
        `Ratios - Face1: ${ratio1.toFixed(2)}, Face2: ${ratio2.toFixed(
          2
        )}, Similarité: ${ratioSimilarity.toFixed(2)}`
      );
    }
  }

  // 3. Comparer les landmarks faciaux (plus important)
  if (face1.landmarks && face2.landmarks) {
    const landmarkScore = compareLandmarksImproved(
      face1.landmarks,
      face2.landmarks
    );
    totalScore += landmarkScore * 2.0; // Poids plus important
    weightSum += 2.0;
    scores.landmarkScore = landmarkScore;
    console.log("Score landmarks:", landmarkScore);
  }

  // 4. Analyser la confiance de détection
  if (face1.detectionConfidence && face2.detectionConfidence) {
    const avgConfidence =
      (face1.detectionConfidence + face2.detectionConfidence) / 2;
    const confidenceScore = Math.min(avgConfidence * 1.2, 1.0); // Bonus léger
    totalScore += confidenceScore * 0.8;
    weightSum += 0.8;
    scores.confidenceScore = confidenceScore;
    console.log(
      `Confiances - Face1: ${face1.detectionConfidence.toFixed(
        2
      )}, Face2: ${face2.detectionConfidence.toFixed(
        2
      )}, Score: ${confidenceScore.toFixed(2)}`
    );
  }

  // 5. Bonus si les angles ne sont pas trop différents (mais tolérant)
  if (face1.rollAngle !== undefined && face2.rollAngle !== undefined) {
    const angleDiff = Math.abs(face1.rollAngle - face2.rollAngle);
    const angleScore = Math.max(0, 1 - angleDiff / 60); // Tolérance de 60°
    totalScore += angleScore * 0.3;
    weightSum += 0.3;
    scores.angleScore = angleScore;
    console.log(
      `Angles - Face1: ${face1.rollAngle.toFixed(
        1
      )}°, Face2: ${face2.rollAngle.toFixed(1)}°, Score: ${angleScore.toFixed(
        2
      )}`
    );
  }

  const finalScore = weightSum > 0 ? totalScore / weightSum : 0.5;

  console.log("Scores détaillés:", scores);
  console.log(
    `Score final: ${finalScore.toFixed(3)} (total: ${totalScore.toFixed(
      2
    )}, poids: ${weightSum.toFixed(2)})`
  );

  return finalScore;
}

/**
 * Calcule le ratio d'aspect d'une boîte englobante
 */
function calculateAspectRatio(vertices) {
  if (!vertices || vertices.length < 4) return 1;

  const width = Math.abs(vertices[1].x - vertices[0].x);
  const height = Math.abs(vertices[2].y - vertices[1].y);

  return width / height;
}

/**
 * Compare les landmarks faciaux avec une approche améliorée
 * Optimisé pour photo de carte d'identité vs selfie
 */
function compareLandmarksImproved(landmarks1, landmarks2) {
  if (!landmarks1 || !landmarks2) return 0.5;

  console.log(
    `Comparaison de ${landmarks1.length} vs ${landmarks2.length} landmarks`
  );

  // Créer des maps pour accès rapide par type
  const map1 = new Map();
  const map2 = new Map();

  landmarks1.forEach((lm) => map1.set(lm.type, lm));
  landmarks2.forEach((lm) => map2.set(lm.type, lm));

  // Landmarks importants pour l'identification (eyes, nose, mouth)
  const criticalLandmarks = [
    "LEFT_EYE",
    "RIGHT_EYE",
    "NOSE_TIP",
    "NOSE_BOTTOM_CENTER",
    "UPPER_LIP",
    "LOWER_LIP",
    "MOUTH_LEFT",
    "MOUTH_RIGHT",
  ];

  // Landmarks de structure faciale
  const structuralLandmarks = [
    "LEFT_EYE_LEFT_CORNER",
    "LEFT_EYE_RIGHT_CORNER",
    "RIGHT_EYE_LEFT_CORNER",
    "RIGHT_EYE_RIGHT_CORNER",
    "NOSE_BOTTOM_LEFT",
    "NOSE_BOTTOM_RIGHT",
    "MOUTH_CENTER",
    "CHIN_GNATHION",
    "CHIN_LEFT_GONION",
    "CHIN_RIGHT_GONION",
  ];

  let criticalScore = 0;
  let criticalCount = 0;
  let structuralScore = 0;
  let structuralCount = 0;

  // Comparer les landmarks critiques
  for (const landmarkType of criticalLandmarks) {
    const lm1 = map1.get(landmarkType);
    const lm2 = map2.get(landmarkType);

    if (lm1 && lm2) {
      const similarity = calculateLandmarkSimilarity(
        lm1.position,
        lm2.position,
        landmarks1,
        landmarks2
      );
      criticalScore += similarity;
      criticalCount++;
      console.log(`${landmarkType}: ${similarity.toFixed(3)}`);
    }
  }

  // Comparer les landmarks structurels
  for (const landmarkType of structuralLandmarks) {
    const lm1 = map1.get(landmarkType);
    const lm2 = map2.get(landmarkType);

    if (lm1 && lm2) {
      const similarity = calculateLandmarkSimilarity(
        lm1.position,
        lm2.position,
        landmarks1,
        landmarks2
      );
      structuralScore += similarity;
      structuralCount++;
    }
  }

  // Calculer les scores moyens
  const avgCritical = criticalCount > 0 ? criticalScore / criticalCount : 0.5;
  const avgStructural =
    structuralCount > 0 ? structuralScore / structuralCount : 0.5;

  // Score final pondéré (landmarks critiques plus importants)
  const finalScore = avgCritical * 0.7 + avgStructural * 0.3;

  console.log(
    `Landmarks - Critiques: ${avgCritical.toFixed(
      3
    )} (${criticalCount}), Structurels: ${avgStructural.toFixed(
      3
    )} (${structuralCount}), Final: ${finalScore.toFixed(3)}`
  );

  return Math.min(finalScore, 1.0);
}

/**
 * Calcule la similarité entre deux landmarks en utilisant la géométrie relative
 */
function calculateLandmarkSimilarity(pos1, pos2, allLandmarks1, allLandmarks2) {
  if (!pos1 || !pos2) return 0;

  // Trouver les landmarks de référence (yeux) pour normaliser
  const leftEye1 = allLandmarks1.find((lm) => lm.type === "LEFT_EYE")?.position;
  const rightEye1 = allLandmarks1.find(
    (lm) => lm.type === "RIGHT_EYE"
  )?.position;
  const leftEye2 = allLandmarks2.find((lm) => lm.type === "LEFT_EYE")?.position;
  const rightEye2 = allLandmarks2.find(
    (lm) => lm.type === "RIGHT_EYE"
  )?.position;

  if (!leftEye1 || !rightEye1 || !leftEye2 || !rightEye2) {
    // Fallback: distance simple normalisée
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0, 1 - distance / 200); // Tolérance plus grande
  }

  // Calculer les distances inter-oculaires comme référence d'échelle
  const eyeDistance1 = Math.sqrt(
    Math.pow(rightEye1.x - leftEye1.x, 2) +
      Math.pow(rightEye1.y - leftEye1.y, 2)
  );
  const eyeDistance2 = Math.sqrt(
    Math.pow(rightEye2.x - leftEye2.x, 2) +
      Math.pow(rightEye2.y - leftEye2.y, 2)
  );

  if (eyeDistance1 === 0 || eyeDistance2 === 0) {
    return 0.5;
  }

  // Normaliser les positions par rapport à la distance inter-oculaire
  const normalizedPos1 = {
    x: (pos1.x - leftEye1.x) / eyeDistance1,
    y: (pos1.y - leftEye1.y) / eyeDistance1,
  };

  const normalizedPos2 = {
    x: (pos2.x - leftEye2.x) / eyeDistance2,
    y: (pos2.y - leftEye2.y) / eyeDistance2,
  };

  // Calculer la distance normalisée
  const dx = normalizedPos1.x - normalizedPos2.x;
  const dy = normalizedPos1.y - normalizedPos2.y;
  const normalizedDistance = Math.sqrt(dx * dx + dy * dy);

  // Retourner la similarité (plus la distance est petite, plus la similarité est grande)
  const similarity = Math.max(0, 1 - normalizedDistance * 2); // Facteur d'ajustement

  return similarity;
}

/**
 * Fonction pour évaluer la qualité d'un selfie
 */
const evaluateSelfieQuality = onCall(async (request) => {
  console.log("=== Selfie Quality Evaluation Start ===");

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Non authentifié");
  }

  const { selfieUri } = request.data;

  if (!selfieUri) {
    throw new HttpsError("invalid-argument", "URI du selfie manquant");
  }
  try {
    const bucket = getStorage().bucket();

    // Extraire le chemin depuis l'URI (support HTTP et gs://)
    let selfiePath;

    if (selfieUri.includes("gs://")) {
      selfiePath = selfieUri
        .replace("gs://", "")
        .replace(`${bucket.name}/`, "");
    } else if (
      selfieUri.includes("firebasestorage.googleapis.com") ||
      selfieUri.includes("firebasestorage.app")
    ) {
      // Extraire le chemin depuis l'URL HTTP Firebase Storage
      const selfieUrl = new URL(selfieUri);
      selfiePath = decodeURIComponent(
        selfieUrl.pathname.split("/o/")[1].split("?")[0]
      );
    } else {
      selfiePath = selfieUri;
    }

    console.log("Chemin selfie extrait:", selfiePath);

    const [selfieBuffer] = await bucket.file(selfiePath).download();

    // Analyser le selfie
    const [faceDetection] = await visionClient.faceDetection({
      image: { content: selfieBuffer.toString("base64") },
    });

    const faces = faceDetection.faceAnnotations || [];
    const issues = [];

    if (faces.length === 0) {
      issues.push("Aucun visage détecté");
      return { isGoodQuality: false, score: 0, issues };
    }

    if (faces.length > 1) {
      issues.push("Plusieurs visages détectés - un seul requis");
    }

    const face = faces[0];
    let score = calculateFaceQuality(face);

    // Vérifications supplémentaires pour les selfies
    if (face.rollAngle && Math.abs(face.rollAngle) > 20) {
      issues.push("Visage trop incliné");
      score *= 0.8;
    }

    if (face.detectionConfidence < 0.7) {
      issues.push("Visage peu net ou mal éclairé");
      score *= 0.7;
    }

    const isGoodQuality = score >= 0.6 && issues.length === 0;

    return {
      isGoodQuality,
      score,
      issues,
    };
  } catch (error) {
    console.error("Erreur lors de l'évaluation du selfie:", error);
    throw new HttpsError("internal", `Erreur interne: ${error.message}`);
  }
});

module.exports = { compareFaces, evaluateSelfieQuality };
