import { collection, query, getDocs, getDoc, doc, where, orderBy, limit, startAfter, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Event } from '@/types/event';

/**
 * Récupérer les événements à venir avec pagination
 */
export const getUpcomingEvents = async (
    pageSize = 10,
    lastEventDoc = null
): Promise<{ events: Event[], lastDoc: any }> => {
    try {
        let eventsQuery;
        const now = new Date();

        if (lastEventDoc) {
            eventsQuery = query(
                collection(db, 'events'),
                where('start_date', '>=', now),
                orderBy('start_date', 'asc'),
                startAfter(lastEventDoc),
                limit(pageSize)
            );
        } else {
            eventsQuery = query(
                collection(db, 'events'),
                where('start_date', '>=', now),
                orderBy('start_date', 'asc'),
                limit(pageSize)
            );
        }

        const snapshot = await getDocs(eventsQuery);

        const events: Event[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            events.push({
                ...data,
                id: doc.id,
                start_date: data.start_date?.toDate?.() || new Date(data.start_date),
                end_date: data.end_date?.toDate?.() || new Date(data.end_date),
            } as Event);
        });

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];

        return { events, lastDoc };
    } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        throw error;
    }
};

/**
 * Rechercher des événements
 */
export const searchEvents = async (searchTerm: string): Promise<Event[]> => {
    try {
        // Firestore ne supporte pas la recherche en texte intégral
        // Cette approche est simplifiée, dans un vrai projet, utilisez Algolia ou une solution similaire
        const eventsRef = collection(db, 'events');
        const snapshot = await getDocs(eventsRef);

        const events: Event[] = [];
        const searchTermLower = searchTerm.toLowerCase();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (
                data.name.toLowerCase().includes(searchTermLower) ||
                data.description.toLowerCase().includes(searchTermLower) ||
                data.location.toLowerCase().includes(searchTermLower)
            ) {
                events.push({
                    ...data,
                    id: doc.id,
                    start_date: data.start_date?.toDate?.() || new Date(data.start_date),
                    end_date: data.end_date?.toDate?.() || new Date(data.end_date),
                } as Event);
            }
        });

        return events;
    } catch (error) {
        console.error('Erreur lors de la recherche des événements:', error);
        throw error;
    }
};

/**
 * Récupérer un événement par son ID
 */
export const getEventById = async (eventId: string): Promise<Event | null> => {
    try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));

        if (!eventDoc.exists()) {
            return null;
        }

        const data = eventDoc.data();

        return {
            ...data,
            id: eventDoc.id,
            start_date: data.start_date?.toDate?.() || new Date(data.start_date),
            end_date: data.end_date?.toDate?.() || new Date(data.end_date),
        } as Event;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'événement:', error);
        throw error;
    }
};

/**
 * Récupérer les événements populaires
 */
export const getPopularEvents = async (limitCount = 5): Promise<Event[]> => {
    try {
        // Dans un vrai projet, vous auriez une métrique de popularité
        // Cette implémentation est simplifiée
        const eventsQuery = query(
            collection(db, 'events'),
            where('start_date', '>=', new Date()),
            orderBy('start_date', 'asc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(eventsQuery);

        const events: Event[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            events.push({
                ...data,
                id: doc.id,
                start_date: data.start_date?.toDate?.() || new Date(data.start_date),
                end_date: data.end_date?.toDate?.() || new Date(data.end_date),
            } as Event);
        });

        return events;
    } catch (error) {
        console.error('Erreur lors de la récupération des événements populaires:', error);
        throw error;
    }
};