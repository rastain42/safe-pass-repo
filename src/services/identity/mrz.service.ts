/**
 * Service de validation MRZ (Machine Readable Zone)
 * Pour vérifier l'authenticité des documents d'identité
 */

export interface MRZData {
  documentType: string;
  countryCode: string;
  lastName: string;
  firstName: string;
  documentNumber: string;
  nationality: string;
  birthDate: string;
  sex: string;
  expirationDate: string;
  isValid: boolean;
  checksumValid: boolean;
}

export interface MRZValidationResult {
  isValid: boolean;
  data: MRZData | null;
  errors: string[];
  confidence: number;
}

export interface OCRData {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  documentNumber?: string;
}

/**
 * Calcule le checksum pour une chaîne MRZ
 */
function calculateChecksum(data: string): number {
  const weights = [7, 3, 1];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    let value: number;

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
 * Formate une date MRZ (YYMMDD) en date lisible
 */
function formatDate(dateStr: string): string {
  if (dateStr.length !== 6) return dateStr;

  const year = parseInt(dateStr.substring(0, 2));
  const month = dateStr.substring(2, 4);
  const day = dateStr.substring(4, 6);

  // Gestion du siècle (assume 20xx pour 00-30, 19xx pour 31-99)
  const fullYear = year <= 30 ? 2000 + year : 1900 + year;

  return `${day}/${month}/${fullYear}`;
}

/**
 * Parse une ligne MRZ de carte d'identité française (TD1)
 */
function parseTD1MRZ(line1: string, line2: string, line3: string): MRZData | null {
  try {
    // Ligne 1: IDFRANCINE<<<<<<<<<<<<<<<<<<<<<<<
    const documentType = line1.substring(0, 2);
    const countryCode = line1.substring(2, 5);
    const documentNumber = line1.substring(5, 14).replace(/</g, '');
    const documentChecksum = parseInt(line1.substring(14, 15));

    // Ligne 2: 7512068F2510127FRA<<<<<<<<<<<6
    const birthDate = line2.substring(0, 6);
    const birthChecksum = parseInt(line2.substring(6, 7));
    const sex = line2.substring(7, 8);
    const expirationDate = line2.substring(8, 14);
    const expChecksum = parseInt(line2.substring(14, 15));
    const nationality = line2.substring(15, 18);

    // Ligne 3: MARTIN<<JEAN<PIERRE<<<<<<<<<<
    const names = line3.replace(/</g, ' ').trim().split('  ');
    const lastName = names[0] || '';
    const firstName = names.slice(1).join(' ') || '';

    // Validation des checksums
    const docChecksumValid = calculateChecksum(documentNumber) === documentChecksum;
    const birthChecksumValid = calculateChecksum(birthDate) === birthChecksum;
    const expChecksumValid = calculateChecksum(expirationDate) === expChecksum;

    const checksumValid = docChecksumValid && birthChecksumValid && expChecksumValid;

    return {
      documentType,
      countryCode,
      lastName,
      firstName,
      documentNumber,
      nationality,
      birthDate: formatDate(birthDate),
      sex,
      expirationDate: formatDate(expirationDate),
      isValid: checksumValid,
      checksumValid,
    };
  } catch (error) {
    console.error('Erreur lors du parsing TD1 MRZ:', error);
    return null;
  }
}

/**
 * Parse une ligne MRZ de passeport (TD3)
 */
function parseTD3MRZ(line1: string, line2: string): MRZData | null {
  try {
    // Ligne 1: P<FRAMARTIN<<JEAN<PIERRE<<<<<<<<<<<<<<<<<<<
    const documentType = line1.substring(0, 1);
    const countryCode = line1.substring(2, 5);
    const names = line1.substring(5).replace(/</g, ' ').trim().split('  ');
    const lastName = names[0] || '';
    const firstName = names.slice(1).join(' ') || '';

    // Ligne 2: 12NC345F251012M7FRA123456789012345678901234567890
    const documentNumber = line2.substring(0, 9).replace(/</g, '');
    const documentChecksum = parseInt(line2.substring(9, 10));
    const nationality = line2.substring(10, 13);
    const birthDate = line2.substring(13, 19);
    const birthChecksum = parseInt(line2.substring(19, 20));
    const sex = line2.substring(20, 21);
    const expirationDate = line2.substring(21, 27);
    const expChecksum = parseInt(line2.substring(27, 28));

    // Validation des checksums
    const docChecksumValid = calculateChecksum(documentNumber) === documentChecksum;
    const birthChecksumValid = calculateChecksum(birthDate) === birthChecksum;
    const expChecksumValid = calculateChecksum(expirationDate) === expChecksum;

    const checksumValid = docChecksumValid && birthChecksumValid && expChecksumValid;

    return {
      documentType: documentType === 'P' ? 'PASSPORT' : documentType,
      countryCode,
      lastName,
      firstName,
      documentNumber,
      nationality,
      birthDate: formatDate(birthDate),
      sex,
      expirationDate: formatDate(expirationDate),
      isValid: checksumValid,
      checksumValid,
    };
  } catch (error) {
    console.error('Erreur lors du parsing TD3 MRZ:', error);
    return null;
  }
}

/**
 * Extrait et valide les données MRZ d'un texte OCR
 */
export const validateMRZ = (ocrText: string): MRZValidationResult => {
  const errors: string[] = [];
  let confidence = 0;
  let mrzData: MRZData | null = null;

  try {
    // Nettoyer le texte OCR
    const lines = ocrText
      .split('\n')
      .map(line => line.trim().replace(/\s/g, ''))
      .filter(line => line.length > 20); // Filtrer les lignes trop courtes

    console.log('Lignes MRZ détectées:', lines);

    // Essayer de détecter le format MRZ
    if (lines.length >= 3) {
      // Format TD1 (carte d'identité)
      const [line1, line2, line3] = lines;
      if (line1.length >= 30 && line2.length >= 30 && line3.length >= 30) {
        mrzData = parseTD1MRZ(line1, line2, line3);
        if (mrzData) {
          confidence = 0.9;
          console.log('MRZ TD1 détectée avec succès');
        }
      }
    }

    if (!mrzData && lines.length >= 2) {
      // Format TD3 (passeport)
      const [line1, line2] = lines;
      if (line1.length >= 44 && line2.length >= 44) {
        mrzData = parseTD3MRZ(line1, line2);
        if (mrzData) {
          confidence = 0.9;
          console.log('MRZ TD3 détectée avec succès');
        }
      }
    }

    if (!mrzData) {
      errors.push('Format MRZ non reconnu ou données incomplètes');
      confidence = 0;
    } else if (!mrzData.checksumValid) {
      errors.push('Checksums MRZ invalides - document possiblement falsifié');
      confidence = 0.3;
    }

    return {
      isValid: mrzData !== null && mrzData.checksumValid,
      data: mrzData,
      errors,
      confidence,
    };
  } catch (error) {
    console.error('Erreur lors de la validation MRZ:', error);
    return {
      isValid: false,
      data: null,
      errors: ["Erreur lors de l'analyse MRZ"],
      confidence: 0,
    };
  }
};

/**
 * Compare les données MRZ avec les données OCR pour validation croisée
 */
export const compareMRZWithOCR = (
  mrzData: MRZData,
  ocrData: OCRData
): {
  matches: boolean;
  discrepancies: string[];
  confidence: number;
} => {
  const discrepancies: string[] = [];
  let matches = 0;
  let totalChecks = 0;

  // Comparer les prénoms
  if (ocrData.firstName && mrzData.firstName) {
    totalChecks++;
    const similarity = calculateStringSimilarity(
      normalizeString(ocrData.firstName),
      normalizeString(mrzData.firstName)
    );
    if (similarity > 0.8) {
      matches++;
    } else {
      discrepancies.push(`Prénom: OCR "${ocrData.firstName}" vs MRZ "${mrzData.firstName}"`);
    }
  }

  // Comparer les noms
  if (ocrData.lastName && mrzData.lastName) {
    totalChecks++;
    const similarity = calculateStringSimilarity(
      normalizeString(ocrData.lastName),
      normalizeString(mrzData.lastName)
    );
    if (similarity > 0.8) {
      matches++;
    } else {
      discrepancies.push(`Nom: OCR "${ocrData.lastName}" vs MRZ "${mrzData.lastName}"`);
    }
  }

  // Comparer les dates de naissance
  if (ocrData.birthDate && mrzData.birthDate) {
    totalChecks++;
    if (normalizeBirthDate(ocrData.birthDate) === normalizeBirthDate(mrzData.birthDate)) {
      matches++;
    } else {
      discrepancies.push(
        `Date de naissance: OCR "${ocrData.birthDate}" vs MRZ "${mrzData.birthDate}"`
      );
    }
  }

  // Comparer les numéros de document
  if (ocrData.documentNumber && mrzData.documentNumber) {
    totalChecks++;
    if (ocrData.documentNumber === mrzData.documentNumber) {
      matches++;
    } else {
      discrepancies.push(
        `N° document: OCR "${ocrData.documentNumber}" vs MRZ "${mrzData.documentNumber}"`
      );
    }
  }

  const confidence = totalChecks > 0 ? matches / totalChecks : 0;
  const matchesAll = discrepancies.length === 0 && confidence > 0.8;

  return {
    matches: matchesAll,
    discrepancies,
    confidence,
  };
};

/**
 * Normalise une chaîne pour la comparaison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Normalise une date de naissance
 */
function normalizeBirthDate(date: string): string {
  // Essayer différents formats et convertir en DD/MM/YYYY
  const cleaned = date.replace(/[^\d]/g, '');

  if (cleaned.length === 8) {
    // Format DDMMYYYY ou YYYYMMDD
    if (cleaned.substring(0, 2) > '31') {
      // Probablement YYYYMMDD
      return `${cleaned.substring(6, 8)}/${cleaned.substring(4, 6)}/${cleaned.substring(0, 4)}`;
    } else {
      // Probablement DDMMYYYY
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4, 8)}`;
    }
  }

  return date;
}

/**
 * Calcule la similarité entre deux chaînes (algorithme de Levenshtein simplifié)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}
