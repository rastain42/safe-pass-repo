import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { analyzeIdDocument, type AnalysisResult } from '../../services/documentAnalysis.service';
import { cleanupSelfieAfterVerification } from '../../services/privacy.service';
import MRZValidationDisplay from '../../components/identity/MRZValidationDisplay';

export default function VerifyIdentityScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const pickImage = async (setter: (value: string | null) => void) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync(); if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la caméra');
        return;
      } const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setter(result.assets[0].uri);

        // Si c'est le recto de la carte, analyser automatiquement
        if (setter === setIdFront) {
          await handleAnalyzeDocument(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la capture d\'image:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra. Veuillez réessayer.');
    }
  };

  const uploadImage = async (uri: string, path: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storage = getStorage();
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const newProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(newProgress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleAnalyzeDocument = async (imageUri: string) => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    setAnalyzing(true);

    try {
      console.log('=== Début analyse document ===');

      // Utiliser la fonction analyzeIdDocument du service
      const result = await analyzeIdDocument(imageUri, auth.currentUser.uid);

      console.log('Résultat analyse:', result);
      setAnalysisResult(result);

      if (result.success && result.confidence > 0.7) {
        const firstName = result.data.firstName?.value || 'Non détecté';
        const lastName = result.data.lastName?.value || 'Non détecté';
        const confidence = Math.round(result.confidence * 100);

        Alert.alert(
          'Document analysé automatiquement ✅',
          `Prénom: ${firstName}\nNom: ${lastName}\nConfiance: ${confidence}%\n\nVous pouvez continuer la vérification.`,
          [{ text: 'Continuer', onPress: () => console.log('Analyse réussie') }]
        );
      } else if (result.success) {
        Alert.alert(
          'Analyse partielle ⚠️',
          `Le document a été analysé mais avec une confiance faible (${Math.round(result.confidence * 100)}%).\n\nLa vérification manuelle sera effectuée.`,
          [{ text: 'Continuer' }]
        );
      } else {
        Alert.alert(
          'Analyse échouée ❌',
          'Le document n\'a pas pu être analysé automatiquement.\n\nLa vérification manuelle sera effectuée.',
          [{ text: 'Continuer' }]
        );
      }

    } catch (error) {
      console.error('Erreur analyse:', error);

      // Gestion des erreurs spécifiques
      let errorMessage = 'Impossible d\'analyser le document automatiquement.';

      if (error instanceof Error) {
        if (error.message.includes('connecté')) {
          errorMessage = 'Vous devez être connecté pour analyser un document.';
        } else if (error.message.includes('permissions')) {
          errorMessage = 'Permissions insuffisantes. Veuillez vous reconnecter.';
        } else if (error.message.includes('non disponible')) {
          errorMessage = 'Service d\'analyse temporairement indisponible.';
        }
      }

      Alert.alert(
        'Erreur d\'analyse',
        `${errorMessage}\n\nLa vérification manuelle sera effectuée à la place.`,
        [{ text: 'Continuer' }]
      );
    } finally {
      setAnalyzing(false);
    }
  }; const handleSubmit = async () => {
    if (!idFront || !auth.currentUser) {
      Alert.alert('Erreur', 'Veuillez au minimum prendre une photo de votre pièce d\'identité');
      return;
    }

    setLoading(true);

    try {
      const userId = auth.currentUser.uid;
      const timestamp = Date.now();      // Upload des images finales
      const idFrontURL = await uploadImage(
        idFront,
        `verifications/${userId}/id_front_${timestamp}.jpg`
      );

      // Upload du selfie seulement s'il est fourni
      let selfieURL = null;
      if (selfie) {
        selfieURL = await uploadImage(
          selfie,
          `verifications/${userId}/selfie_${timestamp}.jpg`
        );
      }

      // Déterminer le statut basé sur l'analyse
      const isAutoApproved = analysisResult?.success && analysisResult.confidence > 0.8;
      const verificationStatus = isAutoApproved ? 'auto_approved' : 'pending';      // Mise à jour avec les résultats d'analyse
      await updateDoc(doc(db, 'users', userId), {
        verification_status: verificationStatus,
        verification_documents: {
          id_front: idFrontURL,
          selfie: selfieURL, // Peut être null
          submitted_at: serverTimestamp(),
          analysis_result: analysisResult || null,
          auto_approved: isAutoApproved,
        }
      }); const message = isAutoApproved
        ? 'Félicitations ! Votre identité a été vérifiée automatiquement grâce à notre système d\'analyse avancé. Votre compte est maintenant vérifié.'
        : 'Votre demande de vérification a été envoyée avec succès. Nos équipes vont examiner votre document et vous informer du résultat sous 24-48h.';

      const title = isAutoApproved ? 'Vérification approuvée ✅' : 'Demande envoyée 📋';

      // Si vérification automatique approuvée et selfie fourni, le supprimer après 7 jours
      if (isAutoApproved && selfie) {
        setTimeout(() => {
          cleanupSelfieAfterVerification(userId);
        }, 7 * 24 * 60 * 60 * 1000); // 7 jours
      }

      Alert.alert(
        title,
        message,
        [{ text: 'Parfait !', onPress: () => router.replace('/(tabs)/Profile') }]
      );

    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      Alert.alert(
        'Erreur d\'envoi',
        'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisResult = () => {
    if (!analysisResult || !analysisResult.success) return null;

    const confidence = Math.round(analysisResult.confidence * 100);
    const confidenceColor = confidence > 80 ? '#0f0' : confidence > 60 ? '#ff0' : '#f80';

    return (
      <View style={styles.analysisResult}>
        <Text style={styles.analysisTitle}>✨ Informations détectées automatiquement:</Text>

        {analysisResult.data.firstName && (
          <Text style={styles.analysisText}>
            👤 Prénom: {analysisResult.data.firstName.value}
            <Text style={styles.confidenceText}> ({Math.round(analysisResult.data.firstName.confidence * 100)}%)</Text>
          </Text>
        )}

        {analysisResult.data.lastName && (
          <Text style={styles.analysisText}>
            👤 Nom: {analysisResult.data.lastName.value}
            <Text style={styles.confidenceText}> ({Math.round(analysisResult.data.lastName.confidence * 100)}%)</Text>
          </Text>
        )}

        {analysisResult.data.birthDate && (
          <Text style={styles.analysisText}>
            📅 Date de naissance: {analysisResult.data.birthDate.value}
            <Text style={styles.confidenceText}> ({Math.round(analysisResult.data.birthDate.confidence * 100)}%)</Text>
          </Text>
        )}

        {analysisResult.data.documentNumber && (
          <Text style={styles.analysisText}>
            🔢 N° document: {analysisResult.data.documentNumber.value}
            <Text style={styles.confidenceText}> ({Math.round(analysisResult.data.documentNumber.confidence * 100)}%)</Text>
          </Text>
        )}

        <Text style={[styles.analysisText, { color: confidenceColor, fontWeight: 'bold', marginTop: 8 }]}>
          🎯 Confiance globale: {confidence}%
        </Text>

        {confidence > 80 && (
          <Text style={styles.successText}>
            ✅ Excellente qualité ! Vérification automatique possible.
          </Text>
        )}
      </View>
    );
  };
  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        <View style={[
          styles.stepDot,
          step >= 1 ? styles.activeStep : styles.inactiveStep
        ]} />
        <View style={styles.stepLine} />
        <View style={[
          styles.stepDot,
          step >= 2 ? styles.activeStep : styles.inactiveStep
        ]} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f0" />
        <Text style={styles.loadingText}>
          Envoi en cours ({progress.toFixed(0)}%)
        </Text>
        <Text style={styles.loadingSubText}>
          Téléchargement de vos documents...
        </Text>
      </View>
    );
  }

  if (analyzing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f0" />
        <Text style={styles.loadingText}>🔍 Analyse en cours...</Text>
        <Text style={styles.loadingSubText}>
          Extraction des informations de votre document
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        title: "Vérification d'identité",
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
      }} />

      <View style={styles.container}>        <View style={styles.card}>
        <Text style={styles.title}>Vérification d'identité</Text>
        <Text style={styles.subtitle}>
          Étape {step}/2 - Vérification automatique activée
        </Text>

        {renderStepIndicator()}          {step === 1 && (
          <>
            <Text style={styles.instruction}>
              📷 Prenez en photo le <Text style={styles.highlight}>recto</Text> de votre pièce d'identité
            </Text>
            <Text style={styles.hint}>
              Seul le recto est nécessaire - L'analyse automatique démarrera après la capture
            </Text>

            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => pickImage(setIdFront)}
            >
              {idFront ? (
                <Image source={{ uri: idFront }} style={styles.preview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <FontAwesome name="id-card" size={32} color="#0f0" />
                  <Text style={styles.placeholderText}>Recto de la carte</Text>
                </View>
              )}
            </TouchableOpacity>

            {renderAnalysisResult()}

            {idFront && (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setStep(2)}
              >
                <Text style={styles.buttonText}>Continuer →</Text>
              </TouchableOpacity>
            )}
          </>
        )}          {step === 2 && (
          <>
            <Text style={styles.instruction}>
              🤳 Prenez un <Text style={styles.highlight}>selfie</Text> avec votre visage clairement visible
            </Text>
            <Text style={styles.hint}>
              Cette photo permettra de vérifier la correspondance avec votre pièce d'identité (optionnel)
            </Text>

            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => pickImage(setSelfie)}
            >
              {selfie ? (
                <Image source={{ uri: selfie }} style={styles.preview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <FontAwesome name="camera" size={32} color="#0f0" />
                  <Text style={styles.placeholderText}>Selfie</Text>
                </View>
              )}
            </TouchableOpacity>

            {analysisResult && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>📋 Résumé de votre demande</Text>
                <Text style={styles.summaryText}>
                  {analysisResult.success && analysisResult.confidence > 0.8
                    ? '✅ Vérification automatique possible'
                    : '👤 Vérification manuelle requise'
                  }
                </Text>
              </View>
            )}              <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep(1)}
              >
                <Text style={styles.backButtonText}>← Retour</Text>
              </TouchableOpacity>

              {selfie ? (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonText}>🚀 Terminer</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.skipButtonText}>⏭️ Passer cette étape</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>✕ Annuler</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  card: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeStep: {
    backgroundColor: '#0f0',
  },
  inactiveStep: {
    backgroundColor: '#333',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  hint: {
    color: '#888',
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  highlight: {
    color: '#0f0',
    fontWeight: 'bold',
  },
  imageButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#222',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  nextButton: {
    backgroundColor: '#0f0',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  }, submitButton: {
    backgroundColor: '#0f0',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  skipButton: {
    backgroundColor: '#ff8800',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 12,
  },
  cancelButtonText: {
    color: '#ff4444',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  loadingSubText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  // Styles pour l'analyse
  analysisResult: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0f0',
  },
  analysisTitle: {
    color: '#0f0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  analysisText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  confidenceText: {
    color: '#888',
    fontSize: 12,
  },
  successText: {
    color: '#0f0',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    color: '#0f0',
    fontSize: 14,
    fontWeight: '500',
  },
});
