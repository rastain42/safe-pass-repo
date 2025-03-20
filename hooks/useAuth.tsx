import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { User as UserType } from '@/types/user';

/**
 * Hook personnalisé pour gérer l'authentification et les données utilisateur
 */
export function useAuth() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [initializing, setInitializing] = useState<boolean>(true);
    const router = useRouter();

    // Écouter les changements d'état d'authentification
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                try {
                    // Charger les données utilisateur depuis Firestore
                    const userDoc = await getDoc(doc(db, 'users', user.uid));

                    if (userDoc.exists()) {
                        const userData = userDoc.data() as UserType;

                        // Convertir les timestamps Firestore en objets Date
                        if (userData.birthDate && userData.birthDate.toDate) {
                            userData.birthDate = userData.birthDate.toDate();
                        }

                        setUserData(userData);

                        // Stocker l'ID utilisateur sécurisé localement pour une persistance limitée
                        await SecureStore.setItemAsync('userId', user.uid);
                    } else {
                        console.warn("Document utilisateur non trouvé dans Firestore");
                    }
                } catch (error) {
                    console.error("Erreur lors du chargement des données utilisateur:", error);
                }
            } else {
                // Réinitialiser les données lorsque l'utilisateur est déconnecté
                setUserData(null);
                await SecureStore.deleteItemAsync('userId');
            }

            setLoading(false);
            if (initializing) setInitializing(false);
        });

        return unsubscribe;
    }, []);

    /**
     * Déconnexion de l'utilisateur
     */
    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
            router.replace('/(auth)/login');
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            throw error;
        }
    };

    /**
     * Rafraîchir les données utilisateur
     */
    const refreshUserData = async (): Promise<void> => {
        if (!currentUser) return;

        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data() as UserType;

                // Convertir les timestamps Firestore en objets Date
                if (userData.birthDate && userData.birthDate.toDate) {
                    userData.birthDate = userData.birthDate.toDate();
                }

                setUserData(userData);
            }
        } catch (error) {
            console.error("Erreur lors du rechargement des données:", error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Vérifier si l'utilisateur est un administrateur
     */
    const isAdmin = (): boolean => {
        return userData?.role === 'admin';
    };

    /**
     * Vérifier si l'utilisateur est vérifié
     */
    const isVerified = (): boolean => {
        return userData?.isVerified === true;
    };

    return {
        currentUser,
        userData,
        loading,
        initializing,
        isLoggedIn: !!currentUser,
        logout,
        refreshUserData,
        isAdmin,
        isVerified
    };
}