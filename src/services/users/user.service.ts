import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserRole, VerificationStatus } from '../../types/shared';
import { auth } from '../../config/firebase';

export interface User {
  id: string;
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  role: UserRole;
  verified_status: VerificationStatus;
  created_at: any;
  updated_at: any;
  verification_documents?: {
    id_front: string;
    id_back: string;
    selfie: string;
    submitted_at: any;
  };
}

/**
 * Récupère un utilisateur par son ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as User;
    }

    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
};

/**
 * Met à jour le profil d'un utilisateur
 */
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updated_at: new Date(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
};

/**
 * Récupère tous les utilisateurs (admin uniquement)
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);

    return querySnapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as User
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return [];
  }
};

/**
 * Recherche des utilisateurs par email ou nom
 */
export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');

    // Recherche par email
    const emailQuery = query(
      usersRef,
      where('email', '>=', searchTerm.toLowerCase()),
      where('email', '<=', searchTerm.toLowerCase() + '\uf8ff')
    );

    const emailSnapshot = await getDocs(emailQuery);
    const usersByEmail = emailSnapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as User
    );

    // Recherche par prénom
    const firstNameQuery = query(
      usersRef,
      where('first_name', '>=', searchTerm),
      where('first_name', '<=', searchTerm + '\uf8ff')
    );

    const firstNameSnapshot = await getDocs(firstNameQuery);
    const usersByFirstName = firstNameSnapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as User
    );

    // Recherche par nom de famille
    const lastNameQuery = query(
      usersRef,
      where('last_name', '>=', searchTerm),
      where('last_name', '<=', searchTerm + '\uf8ff')
    );

    const lastNameSnapshot = await getDocs(lastNameQuery);
    const usersByLastName = lastNameSnapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as User
    );

    // Fusionner et dédupliquer les résultats
    const allUsers = [...usersByEmail, ...usersByFirstName, ...usersByLastName];
    const uniqueUsers = allUsers.filter(
      (user, index, self) => index === self.findIndex(u => u.id === user.id)
    );

    return uniqueUsers;
  } catch (error) {
    console.error("Erreur lors de la recherche d'utilisateurs:", error);
    return [];
  }
};

/**
 * Calcule l'âge d'un utilisateur
 */
export const calculateUserAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Vérifie si un utilisateur peut accéder à une fonctionnalité
 */
export const canUserAccess = (user: User, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.User]: 0,
    [UserRole.Organizer]: 1,
    [UserRole.Admin]: 2,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};

/**
 * Vérifie si l'utilisateur actuel est un organisateur
 */
export const checkUserIsOrganizer = async (): Promise<boolean> => {
  if (!auth.currentUser) return false;
  const user = await getUserById(auth.currentUser.uid);
  return user?.role === UserRole.Organizer || user?.role === UserRole.Admin;
};

/**
 * Récupère l'utilisateur actuellement connecté
 */
export const getCurrentUser = async (): Promise<User | null> => {
  if (!auth.currentUser) return null;
  return await getUserById(auth.currentUser.uid);
};

export const getUserData = async (userId: string): Promise<User | null> => {
  return await getUserById(userId);
};

export const logoutUser = async (): Promise<void> => {
  // Cette fonction devrait être dans auth.service
  // Pour l'instant, on peut la laisser vide ou rediriger vers auth
  console.warn('logoutUser should be implemented in auth.service');
};
