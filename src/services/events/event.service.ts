import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { EventTicket } from '@/types/tickets';
import { AgeRestriction } from '@/types/enum';
import { getDocs, getDoc, query, where, orderBy } from 'firebase/firestore';
import { Event } from '@/types/event';

export interface EventFormData {
  name: string;
  description: string;
  location: string;
  start_date: Date;
  end_date: Date;
  capacity: number;
  age_restriction: AgeRestriction;
  allowUnverifiedUsers: boolean;
  image?: string;
  tickets: EventTicket[];
}

/**
 * Crée un nouvel événement dans Firestore
 */
export const createEvent = async (formData: EventFormData, userId: string) => {
  try {
    const eventsRef = collection(db, 'events');
    const newEventRef = doc(eventsRef); // Génère un nouvel ID automatiquement

    const eventData = {
      ...formData,
      id: newEventRef.id,
      creatorId: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await setDoc(newEventRef, eventData);
    return newEventRef.id;
  } catch (error) {
    console.error("Erreur lors de la création de l'événement:", error);
    throw new Error("Échec de la création de l'événement");
  }
};

/**
 * Sélectionne et traite une image depuis la galerie
 */
export const pickAndProcessImage = async (): Promise<string | null> => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return null;

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 5],
      quality: 1,
    });

    if (picked.canceled) return null;

    const cropped = await ImageManipulator.manipulateAsync(
      picked.assets[0].uri,
      [{ crop: { originX: 0, originY: 0, width: 300, height: 300 } }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );

    return cropped.uri;
  } catch (error) {
    console.error("Erreur lors de la sélection de l'image:", error);
    return null;
  }
};

/**
 * Formate les données brutes Firestore en objet Event
 */
export const formatEventData = (id: string, data: any): Event => {
  return {
    id,
    name: data.name,
    description: data.description,
    location: data.location,
    start_date: data.start_date?.toDate() || new Date(),
    end_date: data.end_date?.toDate() || new Date(),
    capacity: data.capacity,
    age_restriction: data.age_restriction,
    allowUnverifiedUsers: data.allowUnverifiedUsers || false,
    organizerId: data.organizerId,
    image: data.image || null,
    tickets: data.tickets || [],
  } as Event;
};

/**
 * Récupère tous les événements depuis Firestore
 */
export const fetchAllEvents = async (): Promise<Event[]> => {
  try {
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(eventsRef, orderBy('start_date', 'asc'));
    const querySnapshot = await getDocs(eventsQuery);

    return querySnapshot.docs.map(doc => formatEventData(doc.id, doc.data()));
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    throw error;
  }
};

/**
 * Récupère un événement par son ID
 */
export const fetchEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      console.log(`Événement ${eventId} non trouvé`);
      return null;
    }

    return formatEventData(eventDoc.id, eventDoc.data());
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'événement ${eventId}:`, error);
    throw error;
  }
};

export const fetchEventDetails = async (eventId: string) => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (!eventDoc.exists()) {
      throw new Error('Événement introuvable');
    }
    return eventDoc.data();
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de l'événement :", error);
    throw error;
  }
};

/**
 * Récupère tous les événements d'un organisateur
 */
export const getOrganizerEvents = async (organizerId: string): Promise<Event[]> => {
  try {
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(
      eventsRef,
      where('creatorId', '==', organizerId),
      orderBy('start_date', 'desc')
    );
    const querySnapshot = await getDocs(eventsQuery);

    return querySnapshot.docs.map(doc => formatEventData(doc.id, doc.data()));
  } catch (error) {
    console.error("Erreur lors de la récupération des événements de l'organisateur:", error);
    throw error;
  }
};

/**
 * Récupère tous les événements d'un utilisateur
 */
export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('organizer_id', '==', userId), orderBy('start_date', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => formatEventData(doc.id, doc.data()));
  } catch (error) {
    console.error("Erreur lors de la récupération des événements de l'utilisateur:", error);
    throw error;
  }
};
