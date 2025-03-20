import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '@/firebase/config';
import {
    uploadImage,
    submitVerification,
    getVerificationStatus
} from '@/services/identity.service';

export type VerificationStep = 1 | 2 | 3 | 'complete' | 'loading';
export type VerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

interface VerificationImages {
    idFront: string | null;
    idBack: string | null;
    selfie: string | null;
}

interface VerificationInfo {
    status: VerificationStatus;
    isVerified: boolean;
    submissionDate: Date | null;
    rejectionReason?: string;
}

export const useVerifyIdentity = () => {
    // États pour le processus de vérification
    const [step, setStep] = useState<VerificationStep>(1);
    const [images, setImages] = useState<VerificationImages>({
        idFront: null,
        idBack: null,
        selfie: null,
    });
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationInfo, setVerificationInfo] = useState<VerificationInfo | null>(null);

    /**
     * Vérifier le statut actuel de vérification
     */
    const checkVerificationStatus = useCallback(async () => {
        if (!auth.currentUser) {
            setError('Utilisateur non authentifié');
            return;
        }

        try {
            setLoading(true);
            const status = await getVerificationStatus(auth.currentUser.uid);

            if (status) {
                setVerificationInfo({
                    status: status.status as VerificationStatus,
                    isVerified: status.isVerified,
                    submissionDate: status.submissionDate,
                });

                // Si la vérification est déjà en cours ou terminée, passer à 'complete'
                if (status.status !== 'not_submitted') {
                    setStep('complete');
                }
            }
        } catch (err) {
            console.error('Erreur lors de la vérification du statut:', err);
            setError('Impossible de récupérer votre statut de vérification');
        } finally {
            setLoading(false);
        }
    }, []);

    // Vérifier le statut au chargement initial
    useEffect(() => {
        checkVerificationStatus();
    }, [checkVerificationStatus]);

    /**
     * Capture d'image via l'appareil photo
     */
    const captureImage = useCallback(async (
        imageType: keyof VerificationImages
    ): Promise<boolean> => {
        try {
            // Demander la permission d'accès à la caméra
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission refusée',
                    'Nous avons besoin de votre permission pour accéder à la caméra'
                );
                return false;
            }

            // Lancer la caméra
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: imageType === 'selfie' ? [1, 1] : [4, 3],
                quality: 0.8,
            });

            if (result.canceled || !result.assets || !result.assets[0].uri) {
                return false;
            }

            // Mettre à jour l'image capturée
            setImages(prev => ({
                ...prev,
                [imageType]: result.assets[0].uri
            }));

            return true;
        } catch (err) {
            console.error('Erreur lors de la capture d\'image:', err);
            setError('Impossible de capturer l\'image. Veuillez réessayer.');
            return false;
        }
    }, []);

    /**
     * Sélection d'image depuis la galerie (alternative à la caméra)
     */
    const pickImage = useCallback(async (
        imageType: keyof VerificationImages
    ): Promise<boolean> => {
        try {
            // Demander la permission d'accès à la galerie
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission refusée',
                    'Nous avons besoin de votre permission pour accéder à la galerie'
                );
                return false;
            }

            // Lancer la galerie
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: imageType === 'selfie' ? [1, 1] : [4, 3],
                quality: 0.8,
            });

            if (result.canceled || !result.assets || !result.assets[0].uri) {
                return false;
            }

            // Mettre à jour l'image sélectionnée
            setImages(prev => ({
                ...prev,
                [imageType]: result.assets[0].uri
            }));

            return true;
        } catch (err) {
            console.error('Erreur lors de la sélection d\'image:', err);
            setError('Impossible de sélectionner l\'image. Veuillez réessayer.');
            return false;
        }
    }, []);

    /**
     * Avancer dans le processus de vérification
     */
    const goToNextStep = useCallback(() => {
        setStep(prev => {
            if (prev === 1) return 2;
            if (prev === 2) return 3;
            return 'complete';
        });
    }, []);

    /**
     * Revenir à l'étape précédente
     */
    const goToPreviousStep = useCallback(() => {
        setStep(prev => {
            if (prev === 3) return 2;
            if (prev === 2) return 1;
            return 1;
        });
    }, []);

    /**
     * Soumettre la vérification d'identité
     */
    const submitIdentityVerification = useCallback(async (): Promise<boolean> => {
        const { idFront, idBack, selfie } = images;

        // Vérifier que toutes les images sont présentes
        if (!idFront || !idBack || !selfie) {
            setError('Veuillez fournir toutes les images requises');
            return false;
        }

        // Vérifier que l'utilisateur est connecté
        if (!auth.currentUser) {
            setError('Utilisateur non authentifié');
            return false;
        }

        try {
            setLoading(true);
            setStep('loading');
            const userId = auth.currentUser.uid;
            const timestamp = Date.now();

            // Upload des images
            const updateProgress = (progress: number) => {
                setUploadProgress(progress);
            };

            // Upload de l'image recto de la pièce d'identité
            const idFrontUrl = await uploadImage(
                idFront,
                `verifications/${userId}/id_front_${timestamp}.jpg`,
                updateProgress
            );

            // Upload de l'image verso de la pièce d'identité
            const idBackUrl = await uploadImage(
                idBack,
                `verifications/${userId}/id_back_${timestamp}.jpg`,
                updateProgress
            );

            // Upload du selfie
            const selfieUrl = await uploadImage(
                selfie,
                `verifications/${userId}/selfie_${timestamp}.jpg`,
                updateProgress
            );

            // Soumettre la vérification
            await submitVerification(
                userId,
                idFrontUrl,
                idBackUrl,
                selfieUrl,
                updateProgress
            );

            // Mettre à jour le statut
            setVerificationInfo({
                status: 'pending',
                isVerified: false,
                submissionDate: new Date(),
            });

            setStep('complete');
            return true;
        } catch (err) {
            console.error('Erreur lors de la soumission de la vérification:', err);
            setError('Une erreur est survenue lors de l\'envoi de votre demande');
            setStep(3); // Retourner à l'étape du selfie
            return false;
        } finally {
            setLoading(false);
        }
    }, [images]);

    /**
     * Vérifier si l'étape actuelle est complète
     */
    const isStepComplete = useCallback((stepNumber: 1 | 2 | 3): boolean => {
        if (stepNumber === 1) {
            return !!images.idFront;
        } else if (stepNumber === 2) {
            return !!images.idBack;
        } else if (stepNumber === 3) {
            return !!images.selfie;
        }
        return false;
    }, [images]);

    /**
     * Réinitialiser le processus de vérification
     */
    const resetVerification = useCallback(() => {
        setImages({
            idFront: null,
            idBack: null,
            selfie: null,
        });
        setStep(1);
        setError(null);
        setUploadProgress(0);
    }, []);

    return {
        step,
        images,
        uploadProgress,
        loading,
        error,
        verificationInfo,
        captureImage,
        pickImage,
        goToNextStep,
        goToPreviousStep,
        submitIdentityVerification,
        isStepComplete,
        resetVerification,
        checkVerificationStatus,
        setError,
    };
};

export default useVerifyIdentity;