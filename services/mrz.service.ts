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

/**
 * Calcule le checksum pour une chaîne MRZ
 */
function calculateChecksum(data: string): number {
  const weights = [7, 3, 1];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    let value: number;

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
 * Parse une ligne MRZ de carte d'identité française (TD1)
 */
function parseTD1MRZ(
  line1: string,
  line2: string,
  line3: string
): MRZData | null {
  try {
    // Ligne 1: IDFRANCINE<<<<<<<<<<<<<<<<<<<<<<<
    const documentType = line1.substring(0, 2);
    const countryCode = line1.substring(2, 5);
    const documentNumber = line1.substring(5, 14).replace(/</g, "");
    const documentChecksum = parseInt(line1.substring(14, 15));

    // Ligne 2: 7512068F2510127FRA<<<<<<<<<<<6
    const birthDate = line2.substring(0, 6);
    const birthChecksum = parseInt(line2.substring(6, 7));
    const sex = line2.substring(7, 8);
    const expirationDate = line2.substring(8, 14);
    const expChecksum = parseInt(line2.substring(14, 15));
    const nationality = line2.substring(15, 18);

    // Ligne 3: MARTIN<<JEAN<PIERRE<<<<<<<<<<
    const names = line3.replace(/</g, " ").trim().split("  ");
    const lastName = names[0] || "";
    const firstName = names.slice(1).join(" ") || "";

    // Validation des checksums
    const docChecksumValid =
      calculateChecksum(documentNumber) === documentChecksum;
    const birthChecksumValid = calculateChecksum(birthDate) === birthChecksum;
    const expChecksumValid = calculateChecksum(expirationDate) === expChecksum;

    const checksumValid =
      docChecksumValid && birthChecksumValid && expChecksumValid;

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
    return null;
  }
}

/**
 * Parse une ligne MRZ de passeport (TD3)
 */
function parseTD3MRZ(line1: string, line2: string): MRZData | null {
  try {
    // Ligne 1: P<FRMARTIN<<JEAN<PIERRE<<<<<<<<<<<<<<<<<<<<<
    const documentType = line1.substring(0, 1);
    const countryCode = line1.substring(2, 5);
    const names = line1.substring(5).replace(/</g, " ").trim().split("  ");
    const lastName = names[0] || "";
    const firstName = names.slice(1).join(" ") || "";

    // Ligne 2: L898902C36UTO7408122F1204159UTO<<<<<<<<<<<6
    const documentNumber = line2.substring(0, 9).replace(/</g, "");
    const documentChecksum = parseInt(line2.substring(9, 10));
    const nationality = line2.substring(10, 13);
    const birthDate = line2.substring(13, 19);
    const birthChecksum = parseInt(line2.substring(19, 20));
    const sex = line2.substring(20, 21);
    const expirationDate = line2.substring(21, 27);
    const expChecksum = parseInt(line2.substring(27, 28));

    // Validation des checksums
    const docChecksumValid =
      calculateChecksum(documentNumber) === documentChecksum;
    const birthChecksumValid = calculateChecksum(birthDate) === birthChecksum;
    const expChecksumValid = calculateChecksum(expirationDate) === expChecksum;

    const checksumValid =
      docChecksumValid && birthChecksumValid && expChecksumValid;

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
    return null;
  }
}

/**
 * Formate une date YYMMDD en DD/MM/YYYY
 */
function formatDate(dateStr: string): string {
  if (dateStr.length !== 6) return dateStr;

  const year = parseInt(dateStr.substring(0, 2));
  const month = dateStr.substring(2, 4);
  const day = dateStr.substring(4, 6);

  // Années 00-30 = 2000-2030, 31-99 = 1931-1999
  const fullYear = year <= 30 ? 2000 + year : 1900 + year;

  return `${day}/${month}/${fullYear}`;
}

/**
 * Valide les lignes MRZ d'un document d'identité
 */
export function validateMRZ(mrzLines: string[]): MRZValidationResult {
  const errors: string[] = [];

  if (!mrzLines || mrzLines.length === 0) {
    return {
      isValid: false,
      data: null,
      errors: ["Aucune ligne MRZ fournie"],
      confidence: 0,
    };
  }

  // Nettoyer les lignes MRZ
  const cleanLines = mrzLines.map((line) => line.trim().toUpperCase());

  let mrzData: MRZData | null = null;

  if (cleanLines.length === 3 && cleanLines[0].length === 30) {
    // Format TD1 (Carte d'identité)
    mrzData = parseTD1MRZ(cleanLines[0], cleanLines[1], cleanLines[2]);
  } else if (cleanLines.length === 2 && cleanLines[0].length === 44) {
    // Format TD3 (Passeport)
    mrzData = parseTD3MRZ(cleanLines[0], cleanLines[1]);
  } else {
    errors.push("Format MRZ non reconnu");
  }

  if (!mrzData) {
    errors.push("Impossible de parser les données MRZ");
    return {
      isValid: false,
      data: null,
      errors,
      confidence: 0,
    };
  }

  // Validations supplémentaires
  if (!mrzData.checksumValid) {
    errors.push("Checksum MRZ invalide - document potentiellement falsifié");
  }

  if (mrzData.countryCode !== "FRA" && mrzData.countryCode !== "FR") {
    errors.push("Document non français détecté");
  }

  // Vérifier la date d'expiration
  const expDate = new Date(
    mrzData.expirationDate.split("/").reverse().join("-")
  );
  if (expDate < new Date()) {
    errors.push("Document expiré");
  }

  // Calculer le score de confiance
  let confidence = 0.5; // Base
  if (mrzData.checksumValid) confidence += 0.3;
  if (mrzData.documentNumber.length > 0) confidence += 0.1;
  if (mrzData.firstName.length > 0 && mrzData.lastName.length > 0)
    confidence += 0.1;

  return {
    isValid: errors.length === 0 && mrzData.checksumValid,
    data: mrzData,
    errors,
    confidence: Math.min(confidence, 1.0),
  };
}

/**
 * Compare les données MRZ avec les données extraites par OCR
 */
export function compareMRZWithOCR(
  mrzData: MRZData,
  ocrData: any
): {
  matches: boolean;
  discrepancies: string[];
  confidence: number;
} {
  const discrepancies: string[] = [];

  // Vérifications de sécurité
  if (!mrzData || !ocrData) {
    return {
      matches: false,
      discrepancies: ["Données MRZ ou OCR manquantes"],
      confidence: 0,
    };
  }

  // Comparer les noms (normaliser les accents et espaces)
  const normalizeName = (name: string | undefined) => {
    if (!name) return "";
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .toUpperCase();
  };
  if (
    ocrData.firstName &&
    normalizeName(mrzData.firstName) !== normalizeName(ocrData.firstName)
  ) {
    discrepancies.push(
      `Prénom: MRZ="${mrzData.firstName}" vs OCR="${ocrData.firstName}"`
    );
  }

  if (
    ocrData.lastName &&
    normalizeName(mrzData.lastName) !== normalizeName(ocrData.lastName)
  ) {
    discrepancies.push(
      `Nom: MRZ="${mrzData.lastName}" vs OCR="${ocrData.lastName}"`
    );
  }

  if (ocrData.birthDate && mrzData.birthDate !== ocrData.birthDate) {
    discrepancies.push(
      `Date naissance: MRZ="${mrzData.birthDate}" vs OCR="${ocrData.birthDate}"`
    );
  }

  if (
    ocrData.documentNumber &&
    mrzData.documentNumber !== ocrData.documentNumber
  ) {
    discrepancies.push(
      `Numéro: MRZ="${mrzData.documentNumber}" vs OCR="${ocrData.documentNumber}"`
    );
  }

  const matches = discrepancies.length === 0;
  const confidence = matches
    ? 0.95
    : Math.max(0.1, 1 - discrepancies.length * 0.2);

  return {
    matches,
    discrepancies,
    confidence,
  };
}
