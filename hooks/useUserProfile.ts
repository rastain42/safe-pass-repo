import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as userService from "@/services/user.service";

export function useUserProfile() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = userService.getCurrentUser();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await userService.getUserData(user.uid);
        setUserData(data);
      } catch (err) {
        setError("Erreur lors du chargement des données");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await userService.logoutUser();
      router.replace("/(auth)/Login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleVerifyIdentity = () => {
    router.push("/screens/VerifyIdentityScreen");
  };

  return {
    userData,
    user,
    loading,
    error,
    handleLogout,
    handleVerifyIdentity,
  };
}
