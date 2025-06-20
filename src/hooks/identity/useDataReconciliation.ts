import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { User, IdentityData, DataReconciliation, AnalysisResult } from '@/types/user';
import {
  processIdentityVerification,
  applyUserReconciliationChoice,
  resetVerificationProcess,
  VerificationResult,
} from '@/services/identity/identity.service';

interface UseDataReconciliationResult {
  // État
  isProcessing: boolean;
  showReconciliationModal: boolean;
  reconciliation: DataReconciliation | null;
  idData: IdentityData | null;

  // Actions
  processVerification: (
    userId: string,
    analysisResult: AnalysisResult,
    documents: any
  ) => Promise<boolean>;
  handleReconciliationChoice: (
    choice: 'accept_id_data' | 'keep_initial_data' | 'retry_verification'
  ) => Promise<void>;
  closeReconciliationModal: () => void;
}

export const useDataReconciliation = (
  userId: string,
  initialData: IdentityData,
  onVerificationComplete?: (success: boolean) => void
): UseDataReconciliationResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [reconciliation, setReconciliation] = useState<DataReconciliation | null>(null);
  const [idData, setIdData] = useState<IdentityData | null>(null);

  /**
   * Traite la vérification d'identité
   */
  const processVerification = useCallback(
    async (userId: string, analysisResult: AnalysisResult, documents: any): Promise<boolean> => {
      setIsProcessing(true);

      try {
        const result: VerificationResult = await processIdentityVerification(
          userId,
          analysisResult,
          documents
        );

        if (!result.success) {
          Alert.alert(
            'Erreur',
            'Une erreur est survenue lors de la vérification. Veuillez réessayer.'
          );
          return false;
        }

        setIdData(result.idData);

        // Si des conflits existent, afficher la modal de réconciliation
        if (result.hasConflicts && result.reconciliation) {
          setReconciliation(result.reconciliation);
          setShowReconciliationModal(true);
          return true; // Succès mais en attente de choix utilisateur
        } else {
          // Pas de conflits, vérification complète
          Alert.alert('Vérification réussie', 'Vos informations ont été vérifiées avec succès !', [
            {
              text: 'OK',
              onPress: () => onVerificationComplete?.(true),
            },
          ]);
          return true;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        Alert.alert('Erreur', 'Une erreur inattendue est survenue. Veuillez réessayer.');
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [onVerificationComplete]
  );

  /**
   * Gère le choix de l'utilisateur pour la réconciliation
   */
  const handleReconciliationChoice = useCallback(
    async (choice: 'accept_id_data' | 'keep_initial_data' | 'retry_verification') => {
      if (!idData) return;

      setIsProcessing(true);

      try {
        if (choice === 'retry_verification') {
          // Remise à zéro du processus
          const success = await resetVerificationProcess(userId);
          if (success) {
            Alert.alert(
              'Processus remis à zéro',
              "Vous pouvez maintenant recommencer la vérification d'identité.",
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowReconciliationModal(false);
                    onVerificationComplete?.(false);
                  },
                },
              ]
            );
          } else {
            throw new Error('Impossible de remettre à zéro le processus');
          }
        } else {
          // Application du choix
          const success = await applyUserReconciliationChoice(userId, choice, idData);

          if (success) {
            const message =
              choice === 'accept_id_data'
                ? "Vos informations ont été mises à jour avec celles de votre pièce d'identité."
                : 'Vos informations actuelles ont été conservées.';

            Alert.alert('Vérification terminée', message, [
              {
                text: 'OK',
                onPress: () => {
                  setShowReconciliationModal(false);
                  onVerificationComplete?.(true);
                },
              },
            ]);
          } else {
            throw new Error("Impossible d'appliquer le choix");
          }
        }
      } catch (error) {
        console.error('Erreur lors du choix:', error);
        Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
      } finally {
        setIsProcessing(false);
      }
    },
    [userId, idData, onVerificationComplete]
  );

  /**
   * Ferme la modal de réconciliation
   */
  const closeReconciliationModal = useCallback(() => {
    setShowReconciliationModal(false);
    setReconciliation(null);
    setIdData(null);
  }, []);

  return {
    isProcessing,
    showReconciliationModal,
    reconciliation,
    idData,
    processVerification,
    handleReconciliationChoice,
    closeReconciliationModal,
  };
};
