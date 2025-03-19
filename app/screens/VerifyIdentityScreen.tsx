import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';

export default function VerifyIdentityScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const pickImage = async (setter: (value: string | null) => void) => {
    try {
      // Demander les permissions si nécessaire
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la caméra');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setter(result.assets[0].uri);
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
          // Afficher la progression
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

  const handleSubmit = async () => {
    if (!idFront || !idBack || !selfie || !auth.currentUser) {
      Alert.alert('Erreur', 'Veuillez compléter toutes les étapes');
      return;
    }

    setLoading(true);

    try {
      const userId = auth.currentUser.uid;
      const timestamp = Date.now();

      // Upload des images
      const idFrontURL = await uploadImage(
        idFront,
        `verifications/${userId}/id_front_${timestamp}.jpg`
      );

      const idBackURL = await uploadImage(
        idBack,
        `verifications/${userId}/id_back_${timestamp}.jpg`
      );

      const selfieURL = await uploadImage(
        selfie,
        `verifications/${userId}/selfie_${timestamp}.jpg`
      );

      // Mise à jour du statut de vérification dans Firestore
      await updateDoc(doc(db, 'users', userId), {
        verification_status: 'pending',
        verification_documents: {
          id_front: idFrontURL,
          id_back: idBackURL,
          selfie: selfieURL,
          submitted_at: serverTimestamp(),
        }
      });

      Alert.alert(
        'Demande envoyée',
        'Votre demande de vérification a été envoyée. Nous vous informerons dès qu\'elle sera traitée.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/Profile') }]
      );
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi de votre demande');
    } finally {
      setLoading(false);
    }
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
        <View style={styles.stepLine} />
        <View style={[
          styles.stepDot,
          step >= 3 ? styles.activeStep : styles.inactiveStep
        ]} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f0" />
        <Text style={styles.loadingText}>Envoi en cours ({progress.toFixed(0)}%)</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        title: "Vérification d'identité",
      }} />

      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Vérification d'identité</Text>

          {renderStepIndicator()}

          {step === 1 && (
            <>
              <Text style={styles.instruction}>
                Prenez en photo le recto de votre pièce d'identité
              </Text>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage(setIdFront)}
              >
                {idFront ? (
                  <Image source={{ uri: idFront }} style={styles.preview} />
                ) : (
                  <FontAwesome name="id-card" size={24} color="#0f0" />
                )}
              </TouchableOpacity>
              {idFront && (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => setStep(2)}
                >
                  <Text style={styles.buttonText}>Suivant</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.instruction}>
                Prenez en photo le verso de votre pièce d'identité
              </Text>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage(setIdBack)}
              >
                {idBack ? (
                  <Image source={{ uri: idBack }} style={styles.preview} />
                ) : (
                  <FontAwesome name="id-card" size={24} color="#0f0" />
                )}
              </TouchableOpacity>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(1)}
                >
                  <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>
                {idBack && (
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={() => setStep(3)}
                  >
                    <Text style={styles.buttonText}>Suivant</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.instruction}>
                Prenez un selfie avec votre visage clairement visible
              </Text>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage(setSelfie)}
              >
                {selfie ? (
                  <Image source={{ uri: selfie }} style={styles.preview} />
                ) : (
                  <FontAwesome name="camera" size={24} color="#0f0" />
                )}
              </TouchableOpacity>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(2)}
                >
                  <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>
                {selfie && (
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.buttonText}>Terminer</Text>
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
          <Text style={styles.cancelButtonText}>Annuler</Text>
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
    borderRadius: 10,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  imageButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#222',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
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
  },
  nextButton: {
    backgroundColor: '#0f0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: '#222',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#0f0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
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
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
});