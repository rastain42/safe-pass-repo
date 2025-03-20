/**
 * Utilitaires génériques pour l'application SafePass
 */

/**
 * Extrait le prénom et le nom d'un nom complet
 */
export const extractName = (
  fullName: string
): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

/**
 * Retarde l'exécution (sleep/timeout en Promise)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Génère une couleur aléatoire au format HEX
 */
export const randomColor = (): string => {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
};

/**
 * Création d'un objet d'erreur avec code
 */
export const createError = (message: string, code?: string): Error => {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
};

/**
 * Regrouper un tableau d'objets par une propriété
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Trier un tableau d'objets par une propriété
 */
export const sortByProperty = <T>(
  array: T[],
  property: keyof T,
  direction: "asc" | "desc" = "asc"
): T[] => {
  return [...array].sort((a, b) => {
    const valueA = a[property];
    const valueB = b[property];

    // Comparer les dates
    if (valueA instanceof Date && valueB instanceof Date) {
      return direction === "asc"
        ? valueA.getTime() - valueB.getTime()
        : valueB.getTime() - valueA.getTime();
    }

    // Comparer les nombres
    if (typeof valueA === "number" && typeof valueB === "number") {
      return direction === "asc" ? valueA - valueB : valueB - valueA;
    }

    // Comparer les chaînes
    const strA = String(valueA).toLowerCase();
    const strB = String(valueB).toLowerCase();

    return direction === "asc"
      ? strA.localeCompare(strB)
      : strB.localeCompare(strA);
  });
};

/**
 * Génère des initiales à partir d'un nom complet
 */
export const getInitials = (name: string): string => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Récupère les paramètres d'une URL
 */
export const getUrlParams = (url: string): Record<string, string> => {
  try {
    const params: Record<string, string> = {};
    new URL(url).searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch (e) {
    return {};
  }
};

/**
 * Génère un slug à partir d'une chaîne
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

/**
 * Détecter le type d'appareil (web, mobile, tablet)
 */
export const getDeviceType = (): "web" | "mobile" | "tablet" => {
  const userAgent =
    typeof navigator === "undefined" ? "SSR" : navigator.userAgent;

  const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(
    userAgent
  );

  const isMobile =
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      userAgent
    );

  return isTablet ? "tablet" : isMobile ? "mobile" : "web";
};

/**
 * Retourne le nom du mois en français
 */
export const getMonthName = (month: number): string => {
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  return months[month];
};

/**
 * Retourne le jour de la semaine en français
 */
export const getDayName = (day: number): string => {
  const days = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ];
  return days[day];
};

/**
 * Calcule l'âge à partir de la date de naissance
 */
export const calculateAge = (birthDate: Date | string): number => {
  const birth = new Date(birthDate);
  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Copier du texte dans le presse-papier
 */
export const copyToClipboard = (text: string): Promise<void> => {
  return navigator.clipboard.writeText(text);
};

/**
 * Vérifier si un objet est vide
 */
export const isEmptyObject = (obj: any): boolean => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * Formater un nombre avec séparateur de milliers
 */
export const formatNumberWithCommas = (x: number): string => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

/**
 * Générer un identifiant court unique
 */
export const generateShortId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Vérifie si une valeur est définie (non null/undefined)
 */
export const isDefined = (value: any): boolean => {
  return value !== null && value !== undefined;
};

/**
 * Vérifie si deux arrays contiennent les mêmes éléments (ordre non important)
 */
export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i] !== sortedB[i]) return false;
  }

  return true;
};

/**
 * Récupère la valeur d'une propriété imbriquée en toute sécurité
 * Exemple: safeGet(obj, 'user.profile.firstName')
 */
export const safeGet = (
  obj: any,
  path: string,
  defaultValue: any = null
): any => {
  if (!obj) return defaultValue;

  const keys = path.split(".");
  let result = obj;

  for (const key of keys) {
    result = result?.[key];
    if (result === undefined || result === null) return defaultValue;
  }

  return result;
};

/**
 * Convertir un objet en chaîne de requête (query string)
 */
export const objectToQueryString = (obj: Record<string, any>): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Découpe un tableau en morceaux de taille spécifiée
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Obtenir la différence entre deux dates en jours
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // heures * minutes * secondes * millisecondes
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / oneDay);
};
