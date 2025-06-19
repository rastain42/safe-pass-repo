import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as userService from '@/services/users/user.service';
import { auth } from '@/config/firebase';

export function useUserProfile() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await userService.getUserData(auth.currentUser.uid);
        setUserData(data);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [auth.currentUser]);

  const handleLogout = async () => {
    try {
      await userService.logoutUser();
      router.replace('/(auth)/Login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleVerifyIdentity = () => {
    router.push('/screens/VerifyIdentityScreen');
  };
  return {
    userData,
    user: auth.currentUser,
    loading,
    error,
    handleLogout,
    handleVerifyIdentity,
  };
}
