import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function VerifyIdentityScreen() {
  const [step, setStep] = useState(1);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);

  const pickImage = async (setter: (value: string | null) => void) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    try {
      // Ici, ajoutez la logique pour envoyer les images à votre backend
      router.replace('/(tabs)/profile');
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Vérification d'identité</Text>
        
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
                <FontAwesome name="camera" size={24} color="#0f0" />
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

        {/* Ajoutez des conditions similaires pour les étapes 2 (verso) et 3 (selfie) */}
        
        {step === 3 && selfie && (
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Terminer la vérification</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
    marginBottom: 20,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  imageButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#222',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  nextButton: {
    backgroundColor: '#0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});