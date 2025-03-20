/**
 * Utilitaires de formatage pour l'application SafePass
 */
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formater un numéro de téléphone au format international (+33)
 */
export const formatPhone = (phone: string): string => {
    // Nettoyer le numéro (enlever espaces, parenthèses, tirets)
    const cleaned = phone.trim().replace(/\s/g, '').replace(/[()-]/g, '');

    // Si le numéro commence déjà par +, on le retourne tel quel
    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    // Si le numéro commence par 0, on le remplace par +33
    if (cleaned.startsWith('0')) {
        return `+33${cleaned.substring(1)}`;
    }

    // Sinon on ajoute +33 devant
    return `+33${cleaned}`;
};

/**
 * Formater un numéro de téléphone pour l'affichage (06 12 34 56 78)
 */
export const formatPhoneDisplay = (phone: string): string => {
    // S'assurer qu'on a un format international
    const international = formatPhone(phone);

    // Extraire les chiffres sans le +33
    let digits;
    if (international.startsWith('+33')) {
        digits = '0' + international.substring(3);
    } else {
        digits = international;
    }

    // Formater en groupes de 2 chiffres
    return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

/**
 * Formater une date (date complète)
 */
export const formatDate = (date: Date | string | number): string => {
    let dateObj: Date;

    if (typeof date === 'string') {
        dateObj = new Date(date);
    } else if (typeof date === 'number') {
        dateObj = new Date(date);
    } else {
        dateObj = date;
    }

    if (!isValid(dateObj)) {
        return 'Date invalide';
    }

    return format(dateObj, 'dd MMMM yyyy', { locale: fr });
};

/**
 * Formater une date courte (01/01/2025)
 */
export const formatShortDate = (date: Date | string | number): string => {
    let dateObj: Date;

    if (typeof date === 'string') {
        dateObj = new Date(date);
    } else if (typeof date === 'number') {
        dateObj = new Date(date);
    } else {
        dateObj = date;
    }

    if (!isValid(dateObj)) {
        return 'Date invalide';
    }

    return format(dateObj, 'dd/MM/yyyy');
};

/**
 * Formater date et heure
 */
export const formatDateTime = (date: Date | string | number): string => {
    let dateObj: Date;

    if (typeof date === 'string') {
        dateObj = new Date(date);
    } else if (typeof date === 'number') {
        dateObj = new Date(date);
    } else {
        dateObj = date;
    }

    if (!isValid(dateObj)) {
        return 'Date invalide';
    }

    return format(dateObj, 'dd/MM/yyyy à HH:mm', { locale: fr });
};

/**
 * Formater un prix (XX,XX €)
 */
export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(price);
};

/**
 * Formater un prix simplifié (XX€)
 */
export const formatSimplePrice = (price: number): string => {
    return `${price}€`;
};

/**
 * Mettre en majuscule la première lettre
 */
export const capitalizeFirstLetter = (text: string): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Mettre en majuscule chaque première lettre de chaque mot
 */
export const titleCase = (text: string): string => {
    if (!text) return '';
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Tronquer du texte avec ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

/**
 * Formater un nom complet (Prénom Nom)
 */
export const formatFullName = (firstName: string, lastName: string): string => {
    return `${capitalizeFirstLetter(firstName)} ${lastName.toUpperCase()}`;
};

/**
 * Formater un identifiant de ticket pour affichage
 */
export const formatTicketId = (ticketId: string): string => {
    if (!ticketId) return '';
    // Prend les 8 derniers caractères de l'ID pour un affichage simplifié
    const short = ticketId.slice(-8).toUpperCase();
    return short.replace(/(.{4})/, '$1-');
};

/**
 * Formater une durée en minutes en format lisible
 */
export const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return hours === 1 ? `${hours} heure` : `${hours} heures`;
    }

    return `${hours}h${remainingMinutes}`;
};

/**
 * Formater un nombre avec séparateur de milliers
 */
export const formatNumber = (number: number): string => {
    return new Intl.NumberFormat('fr-FR').format(number);
};