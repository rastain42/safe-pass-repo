import { useState, useEffect } from "react";
import { checkUserIsOrganizer } from "@/services/user.service";

export function useUserRole() {
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const isUserOrganizer = await checkUserIsOrganizer();
        setIsOrganizer(isUserOrganizer);
      } catch (error) {
        console.error("Erreur lors de la vérification du rôle:", error);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, []);

  return { isOrganizer, loading };
}
