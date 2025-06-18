const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { DocumentProcessorServiceClient } = require("@google-cloud/documentai");

// Initialize the client - let it use default credentials
const client = new DocumentProcessorServiceClient();

/**
 * Calcule le checksum pour une chaîne MRZ
 */
function calculateChecksum(data) {
  const weights = [7, 3, 1];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    let value;

    if (char >= "0" && char <= "9") {
      value = parseInt(char);
    } else if (char >= "A" && char <= "Z") {
      value = char.charCodeAt(0) - "A".charCodeAt(0) + 10;
    } else {
      value = 0; // Pour les '<' et autres caractères
    }

    sum += value * weights[i % 3];
  }

  return sum % 10;
}

/**
 * Valide les lignes MRZ extraites du document
 */
function validateMRZLines(mrzLines) {
  if (!mrzLines || mrzLines.length === 0) {
    return { isValid: false, errors: ["Aucune ligne MRZ trouvée"] };
  }

  const cleanLines = mrzLines.map((line) => line.trim().toUpperCase());

  // Pour les cartes d'identité françaises (3 lignes)
  if (cleanLines.length === 3 && cleanLines[0].length === 30) {
    const documentNumber = cleanLines[0].substring(5, 14).replace(/</g, "");
    const documentChecksum = parseInt(cleanLines[0].substring(14, 15));
    const birthDate = cleanLines[1].substring(0, 6);
    const birthChecksum = parseInt(cleanLines[1].substring(6, 7));

    const docChecksumValid =
      calculateChecksum(documentNumber) === documentChecksum;
    const birthChecksumValid = calculateChecksum(birthDate) === birthChecksum;

    return {
      isValid: docChecksumValid && birthChecksumValid,
      errors: [
        ...(docChecksumValid
          ? []
          : ["Checksum du numéro de document invalide"]),
        ...(birthChecksumValid
          ? []
          : ["Checksum de la date de naissance invalide"]),
      ],
    };
  }

  // Pour les passeports (2 lignes)
  if (cleanLines.length === 2 && cleanLines[0].length === 44) {
    const passportNumber = cleanLines[0].substring(5, 14).replace(/</g, "");
    const passportChecksum = parseInt(cleanLines[0].substring(14, 15));

    const passportChecksumValid =
      calculateChecksum(passportNumber) === passportChecksum;

    return {
      isValid: passportChecksumValid,
      errors: passportChecksumValid
        ? []
        : ["Checksum du numéro de passeport invalide"],
    };
  }

  return { isValid: false, errors: ["Format MRZ non reconnu"] };
}

/**
 * Fonction Firebase pour analyser un document d'identité
 */
const analyzeIdentityDocument = onCall(async (request) => {
  console.log("=== Document AI Analysis Start ===");
  console.log("Project Number:", process.env.GOOGLE_CLOUD_PROJECT_NUMBER);
  console.log("Processor ID:", process.env.GOOGLE_CLOUD_PROCESSOR_ID);
  console.log("GCS URI:", request.data.gcsUri);
  console.log("User UID:", request.auth?.uid);

  // Vérifier l'authentification
  if (!request.auth) {
    throw new HttpsError("failed-precondition", "Non authentifié");
  }

  const { gcsUri } = request.data;
  if (!gcsUri) {
    throw new HttpsError("invalid-argument", "URI GCS manquant");
  }

  try {
    // Use the project NUMBER for Document AI (not project ID)
    const projectNumber =
      process.env.GOOGLE_CLOUD_PROJECT_NUMBER || "977260058877";
    const processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID;
    const processorVersion = process.env.GOOGLE_CLOUD_PROCESSOR_VERSION;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "eu";

    if (!processorId) {
      throw new Error("GOOGLE_CLOUD_PROCESSOR_ID not configured");
    }

    // Construire le nom du processeur avec ou sans version spécifique
    let name;
    if (processorVersion) {
      name = `projects/${projectNumber}/locations/${location}/processors/${processorId}/processorVersions/${processorVersion}`;
      console.log("Using specific processor version:", processorVersion);
    } else {
      name = `projects/${projectNumber}/locations/${location}/processors/${processorId}`;
      console.log("Using default processor version");
    }
    console.log("Full processor name:", name);

    // Detect MIME type from file extension or default to image/jpeg
    let mimeType = "image/jpeg";
    if (gcsUri.toLowerCase().includes(".png")) {
      mimeType = "image/png";
    } else if (gcsUri.toLowerCase().includes(".pdf")) {
      mimeType = "application/pdf";
    }
    console.log("Detected MIME type:", mimeType);

    const documentRequest = {
      name,
      rawDocument: {
        gcsDocument: {
          gcsUri: gcsUri,
          mimeType: mimeType,
        },
      },
    };

    console.log("Document request:", JSON.stringify(documentRequest, null, 2));
    console.log("Sending request to Document AI...");

    const [result] = await client.processDocument(documentRequest);
    console.log("Document AI response received");
    console.log("Full result structure:", JSON.stringify(result, null, 2));

    const document = result.document;

    // Extraire les données structurées avec scores de confiance
    const extractedData = {};
    let totalConfidence = 0;
    let fieldCount = 0;

    // Support pour Custom Extractor - vérifier d'abord les entités
    if (document.entities && document.entities.length > 0) {
      console.log("Processing entities from Custom Extractor");
      document.entities.forEach((entity) => {
        const type = entity.type;
        const mentionText = entity.mentionText;
        const confidence = entity.confidence || 0;

        console.log(
          `Entity found - Type: ${type}, Text: ${mentionText}, Confidence: ${confidence}`
        );

        // Stocker avec le score de confiance
        const fieldData = {
          value: mentionText,
          confidence: confidence,
        };

        // Mapping pour Custom Extractor - adapter selon votre configuration
        switch (type.toLowerCase()) {
          case "given_names":
          case "given_name":
          case "first_name":
          case "firstname":
          case "prenom":
            extractedData.firstName = fieldData;
            break;
          case "family_name":
          case "last_name":
          case "lastname":
          case "surname":
          case "nom":
            extractedData.lastName = fieldData;
            break;
          case "birth_date":
          case "birthdate":
          case "date_of_birth":
          case "date_naissance":
            extractedData.birthDate = fieldData;
            break;
          case "document_id":
          case "doc_id":
          case "document_number":
          case "numero_document":
            extractedData.documentNumber = fieldData;
            break;
          case "address":
          case "adresse":
            extractedData.address = fieldData;
            break;
          default:
            // Stocker les entités non reconnues pour debugging
            extractedData[type] = fieldData;
            console.log(
              `Unknown entity type: ${type} with value: ${mentionText}`
            );
            break;
        }

        totalConfidence += confidence;
        fieldCount++;
      });
    }

    // Fallback : essayer d'extraire depuis les champs de formulaire si pas d'entités
    if (
      fieldCount === 0 &&
      document.pages &&
      document.pages[0] &&
      document.pages[0].formFields
    ) {
      console.log("No entities found, trying form fields");
      document.pages[0].formFields.forEach((field) => {
        if (field.fieldName && field.fieldValue) {
          const fieldName = field.fieldName.textAnchor
            ? document.text.substring(
                field.fieldName.textAnchor.textSegments[0].startIndex,
                field.fieldName.textAnchor.textSegments[0].endIndex
              )
            : "";

          const fieldValue = field.fieldValue.textAnchor
            ? document.text.substring(
                field.fieldValue.textAnchor.textSegments[0].startIndex,
                field.fieldValue.textAnchor.textSegments[0].endIndex
              )
            : "";

          const confidence = field.fieldValue.confidence || 0;

          console.log(
            `Form field - Name: ${fieldName}, Value: ${fieldValue}, Confidence: ${confidence}`
          );

          // Mapping similar to entities
          const normalizedName = fieldName.toLowerCase().trim();
          if (
            normalizedName.includes("nom") ||
            normalizedName.includes("name")
          ) {
            if (
              normalizedName.includes("prenom") ||
              normalizedName.includes("first")
            ) {
              extractedData.firstName = { value: fieldValue, confidence };
            } else {
              extractedData.lastName = { value: fieldValue, confidence };
            }
          }

          totalConfidence += confidence;
          fieldCount++;
        }
      });
    }

    // Fallback final : extraire le texte brut si aucune donnée structurée
    if (fieldCount === 0 && document.text) {
      console.log("No structured data found, extracting from raw text");
      // Tentative d'extraction basique depuis le texte brut
      const text = document.text;
      extractedData.rawText = { value: text, confidence: 0.5 };
      totalConfidence = 0.5;
      fieldCount = 1;
    }

    const overallConfidence = fieldCount > 0 ? totalConfidence / fieldCount : 0;

    console.log(
      `Extracted ${fieldCount} fields with overall confidence: ${overallConfidence}`
    );
    console.log("Extracted data:", JSON.stringify(extractedData, null, 2));

    // Validation des lignes MRZ si présentes
    let mrzValidationResult = { isValid: true, errors: [] };
    if (extractedData.mrzLines) {
      mrzValidationResult = validateMRZLines(extractedData.mrzLines);
      extractedData.mrzValid = mrzValidationResult.isValid;
      extractedData.mrzErrors = mrzValidationResult.errors;
    }

    return {
      success: true,
      data: extractedData,
      confidence: overallConfidence,
      processorType: "custom_extractor",
      debugInfo: {
        entitiesFound: document.entities ? document.entities.length : 0,
        formFieldsFound:
          document.pages && document.pages[0] && document.pages[0].formFields
            ? document.pages[0].formFields.length
            : 0,
        hasRawText: !!document.text,
      },
    };
  } catch (error) {
    console.error("Erreur Document AI:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error details:", error.details);

    // Afficher les détails de l'erreur BadRequest
    if (error.statusDetails && error.statusDetails.length > 0) {
      console.error(
        "Status details:",
        JSON.stringify(error.statusDetails, null, 2)
      );
      error.statusDetails.forEach((detail, index) => {
        console.error(`Status detail ${index}:`, detail);
        if (detail.fieldViolations) {
          detail.fieldViolations.forEach((violation, vIndex) => {
            console.error(`Field violation ${vIndex}:`, violation);
          });
        }
      });
    }

    // Handle specific errors
    if (error.code === 3 || error.message.includes("INVALID_ARGUMENT")) {
      console.error("INVALID_ARGUMENT error - possible causes:");
      console.error(
        "1. Processor ID incorrect:",
        process.env.GOOGLE_CLOUD_PROCESSOR_ID
      );
      console.error(
        "2. Project number incorrect:",
        process.env.GOOGLE_CLOUD_PROJECT_NUMBER
      );
      console.error("3. GCS URI format invalid:", gcsUri);
      console.error("4. Document type not supported by processor");
      console.error("5. Region mismatch - processor might not be in EU region");
      console.error("6. Custom Extractor not properly configured");

      // Ne pas retourner de mode développement - lancer l'erreur réelle
      throw new HttpsError(
        "failed-precondition",
        `Configuration Document AI incorrecte: ${error.message}. Vérifiez le processeur ID, le numéro de projet et la région.`
      );
    } // If it's a permission error, provide a helpful message
    if (error.code === 7 || error.message.includes("PERMISSION_DENIED")) {
      console.error("Document AI API not properly configured.");

      // Ne pas retourner de mode développement - lancer l'erreur réelle
      throw new HttpsError(
        "permission-denied",
        "Permissions Document AI insuffisantes. Vérifiez les rôles IAM du service account."
      );
    }
    throw new HttpsError(
      "internal",
      `Erreur lors de l'analyse du document: ${error.message}`
    );
  }
});

module.exports = { analyzeIdentityDocument };
