const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');

// Define secrets
const processorId = defineSecret('GOOGLE_CLOUD_PROCESSOR_ID');
const projectNumber = defineSecret('GOOGLE_CLOUD_PROJECT_NUMBER');

// Initialize the client with EU region
const client = new DocumentProcessorServiceClient({
  apiEndpoint: 'eu-documentai.googleapis.com',
});

/**
 * Calcule le checksum pour une chaîne MRZ
 */
function calculateChecksum(data) {
  const weights = [7, 3, 1];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    let value;

    if (char >= '0' && char <= '9') {
      value = parseInt(char);
    } else if (char >= 'A' && char <= 'Z') {
      value = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
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
    return { isValid: false, errors: ['Aucune ligne MRZ trouvée'] };
  }

  const cleanLines = mrzLines.map(line => line.trim().toUpperCase());

  // Pour les cartes d'identité françaises (3 lignes)
  if (cleanLines.length === 3 && cleanLines[0].length === 30) {
    const documentNumber = cleanLines[0].substring(5, 14).replace(/</g, '');
    const documentChecksum = parseInt(cleanLines[0].substring(14, 15));
    const birthDate = cleanLines[1].substring(0, 6);
    const birthChecksum = parseInt(cleanLines[1].substring(6, 7));

    const docChecksumValid = calculateChecksum(documentNumber) === documentChecksum;
    const birthChecksumValid = calculateChecksum(birthDate) === birthChecksum;

    return {
      isValid: docChecksumValid && birthChecksumValid,
      errors: [
        ...(docChecksumValid ? [] : ['Checksum du numéro de document invalide']),
        ...(birthChecksumValid ? [] : ['Checksum de la date de naissance invalide']),
      ],
    };
  }

  // Pour les passeports (2 lignes)
  if (cleanLines.length === 2 && cleanLines[0].length === 44) {
    const passportNumber = cleanLines[0].substring(5, 14).replace(/</g, '');
    const passportChecksum = parseInt(cleanLines[0].substring(14, 15));

    const passportChecksumValid = calculateChecksum(passportNumber) === passportChecksum;

    return {
      isValid: passportChecksumValid,
      errors: passportChecksumValid ? [] : ['Checksum du numéro de passeport invalide'],
    };
  }

  return { isValid: false, errors: ['Format MRZ non reconnu'] };
}

/**
 * Fonction Firebase pour analyser un document d'identité
 */
const analyzeIdentityDocument = onCall(
  {
    secrets: [processorId, projectNumber],
  },
  async request => {
    console.log('=== Document AI Analysis Start ===');
    console.log('GCS URI:', request.data.gcsUri);
    console.log('User UID:', request.auth?.uid);

    // Vérifier l'authentification
    if (!request.auth) {
      throw new HttpsError('failed-precondition', 'Non authentifié');
    }

    const { gcsUri } = request.data;
    if (!gcsUri) {
      throw new HttpsError('invalid-argument', 'URI GCS manquant');
    }
    try {
      // Get configuration values from secrets
      const projectNum = projectNumber.value() || '977260058877';
      const procId = processorId.value();
      const loc = 'eu'; // Default location

      console.log('Configuration loaded:', {
        projectNumber: projectNum,
        processorId: procId ? '***configured***' : 'not configured',
        location: loc,
      });
      if (!procId || procId === 'not_configured') {
        console.error('Document AI not configured - PROCESSOR_ID secret missing');
        throw new HttpsError(
          'failed-precondition',
          'Document AI not configured: GOOGLE_CLOUD_PROCESSOR_ID secret is missing or not set properly'
        );
      } // Construire le nom du processeur (sans version spécifique)
      const name = `projects/${projectNum}/locations/${loc}/processors/${procId}`;
      console.log('Full processor name:', name);

      // Detect MIME type from file extension or default to image/jpeg
      let mimeType = 'image/jpeg';
      if (gcsUri.toLowerCase().includes('.png')) {
        mimeType = 'image/png';
      } else if (gcsUri.toLowerCase().includes('.pdf')) {
        mimeType = 'application/pdf';
      }
      console.log('Detected MIME type:', mimeType); // Télécharger le fichier depuis GCS et le convertir en base64
      console.log('Downloading file from GCS for base64 conversion...');
      const { getStorage } = require('firebase-admin/storage');
      const admin = require('firebase-admin');

      const bucket = getStorage().bucket();

      // Extraire le chemin du fichier depuis l'URI GCS
      const gcsPath = gcsUri.replace('gs://', '').replace(`${bucket.name}/`, '');
      console.log('GCS file path:', gcsPath);

      const file = bucket.file(gcsPath);
      const [fileBuffer] = await file.download();
      const base64Content = fileBuffer.toString('base64');

      console.log('File converted to base64, length:', base64Content.length);

      const documentRequest = {
        name,
        rawDocument: {
          content: base64Content,
          mimeType: mimeType,
        },
        skipHumanReview: true,
      };
      console.log('Sending request to Document AI...');
      console.log(
        'Document request prepared - base64 length:',
        base64Content.length,
        'MIME type:',
        mimeType
      );

      const [result] = await client.processDocument(documentRequest);
      console.log('Document AI response received');

      // Log structure info without full content to avoid memory issues
      const resultInfo = {
        hasDocument: !!result.document,
        hasText: !!result.document?.text,
        textLength: result.document?.text?.length || 0,
        entitiesCount: result.document?.entities?.length || 0,
        pagesCount: result.document?.pages?.length || 0,
        formFieldsCount: result.document?.pages?.[0]?.formFields?.length || 0,
      };
      console.log('Document AI result info:', JSON.stringify(resultInfo, null, 2));

      const document = result.document;

      // Extraire les données structurées avec scores de confiance
      const extractedData = {};
      let totalConfidence = 0;
      let fieldCount = 0;

      // Support pour Custom Extractor - vérifier d'abord les entités
      if (document.entities && document.entities.length > 0) {
        console.log('Processing entities from Custom Extractor');
        document.entities.forEach(entity => {
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
            case 'given_names':
            case 'given_name':
            case 'first_name':
            case 'firstname':
            case 'prenom':
              extractedData.firstName = fieldData;
              break;
            case 'family_name':
            case 'last_name':
            case 'lastname':
            case 'surname':
            case 'nom':
              extractedData.lastName = fieldData;
              break;
            case 'birth_date':
            case 'birthdate':
            case 'date_of_birth':
            case 'date_naissance':
              extractedData.birthDate = fieldData;
              break;
            case 'document_id':
            case 'doc_id':
            case 'document_number':
            case 'numero_document':
              extractedData.documentNumber = fieldData;
              break;
            case 'address':
            case 'adresse':
              extractedData.address = fieldData;
              break;
            default:
              // Stocker les entités non reconnues pour debugging
              extractedData[type] = fieldData;
              console.log(`Unknown entity type: ${type} with value: ${mentionText}`);
              break;
          }

          totalConfidence += confidence;
          fieldCount++;
        });
      }

      // Fallback : essayer d'extraire depuis les champs de formulaire si pas d'entités
      if (fieldCount === 0 && document.pages && document.pages[0] && document.pages[0].formFields) {
        console.log('No entities found, trying form fields');
        document.pages[0].formFields.forEach(field => {
          if (field.fieldName && field.fieldValue) {
            const fieldName = field.fieldName.textAnchor
              ? document.text.substring(
                  field.fieldName.textAnchor.textSegments[0].startIndex,
                  field.fieldName.textAnchor.textSegments[0].endIndex
                )
              : '';

            const fieldValue = field.fieldValue.textAnchor
              ? document.text.substring(
                  field.fieldValue.textAnchor.textSegments[0].startIndex,
                  field.fieldValue.textAnchor.textSegments[0].endIndex
                )
              : '';

            const confidence = field.fieldValue.confidence || 0;

            console.log(
              `Form field - Name: ${fieldName}, Value: ${fieldValue}, Confidence: ${confidence}`
            );

            // Mapping similar to entities
            const normalizedName = fieldName.toLowerCase().trim();
            if (normalizedName.includes('nom') || normalizedName.includes('name')) {
              if (normalizedName.includes('prenom') || normalizedName.includes('first')) {
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
        console.log('No structured data found, extracting from raw text');
        // Tentative d'extraction basique depuis le texte brut
        const text = document.text;
        extractedData.rawText = { value: text, confidence: 0.5 };
        totalConfidence = 0.5;
        fieldCount = 1;
      }

      const overallConfidence = fieldCount > 0 ? totalConfidence / fieldCount : 0;

      console.log(`Extracted ${fieldCount} fields with overall confidence: ${overallConfidence}`);
      console.log('Extracted data:', JSON.stringify(extractedData, null, 2));

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
        processorType: 'custom_extractor',
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
      console.error('Erreur Document AI:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);

      // Afficher les détails de l'erreur BadRequest
      if (error.statusDetails && error.statusDetails.length > 0) {
        console.error('Status details:', JSON.stringify(error.statusDetails, null, 2));
        error.statusDetails.forEach((detail, index) => {
          console.error(`Status detail ${index}:`, detail);
          if (detail.fieldViolations) {
            detail.fieldViolations.forEach((violation, vIndex) => {
              console.error(`Field violation ${vIndex}:`, violation);
            });
          }
        });
      } // Handle specific errors
      if (error.code === 3 || error.message.includes('INVALID_ARGUMENT')) {
        console.error('INVALID_ARGUMENT error - diagnostic détaillé:');
        console.error('1. Processor ID utilisé:', procId);
        console.error('2. Project number utilisé:', projectNum);
        console.error('3. GCS URI format:', gcsUri);
        console.error('4. Document type not supported by processor');
        console.error('5. Region mismatch - processor might not be in EU region');
        console.error('6. Custom Extractor not properly configured');
        console.error('7. Full processor name:', name);

        throw new HttpsError(
          'failed-precondition',
          `Configuration Document AI incorrecte: ${error.message}. Processor: ${procId}, Project: ${projectNum}, GCS URI: ${gcsUri}`
        );
      }

      // If it's a permission error, provide detailed error
      if (error.code === 7 || error.message.includes('PERMISSION_DENIED')) {
        console.error('Document AI PERMISSION_DENIED error');
        console.error('Service account permissions insuffisantes');
        console.error('Vérifiez que le service account a les rôles:');
        console.error('- Document AI API User');
        console.error('- Storage Object Viewer');

        throw new HttpsError(
          'permission-denied',
          `Permissions Document AI insuffisantes: ${error.message}. Vérifiez les rôles IAM du service account.`
        );
      }
      throw new HttpsError('internal', `Erreur lors de l'analyse du document: ${error.message}`);
    }
  }
);

module.exports = { analyzeIdentityDocument };
