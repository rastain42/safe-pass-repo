import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { getAuth, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { firebaseConfig } from '../../firebaseConfig';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';

export default function RegisterScreen() {
  const router = useRouter();
  const db = getFirestore();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const [email, setEmail] = useState('');
  const [passwordHash, setPasswordHash] = useState('');
  const [role, setRole] = useState('participant');
  const [verifiedStatus, setVerifiedStatus] = useState('non_verified');

  const handleSendVerificationCode = async () => {
    try {
      const auth = getAuth();
      const formattedPhone = phoneNumber.startsWith('+33')
        ? phoneNumber
        : `+33${phoneNumber.replace(/^0/, '')}`;
      const provider = new PhoneAuthProvider(auth);
       // En dev, utilisez ces numéros de test
    if (__DEV__) {
      // Ces numéros fonctionnent automatiquement en mode émulation
      // +1 650-555-1234 -> 123456
      // +1 650-555-5678 -> 654321
      setVerificationId('testVerificationId');
      setIsCodeSent(true);
      return;
    }
      const vId = await provider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier.current as any
      );
      setVerificationId(vId);
      setIsCodeSent(true);
      setError(null);
    } catch (err: any) {
      setError("Erreur lors de l'envoi du code : " + err.message);
    }
  };

  const handleVerifyCode = async () => {
    try {
      if (__DEV__ && verificationCode === '123456') {
        router.replace('/(tabs)');
        return;
      }
      const auth = getAuth();
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await signInWithCredential(auth, credential);
      setShowRegisterForm(true);
      setVerifiedStatus('verified');
      setError(null);
    } catch (err: any) {
      setError("Erreur de vérification : " + err.message);
    }
  };

  const handleRegisterUser = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError("Impossible de récupérer l'utilisateur après vérification.");
        return;
      }
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        phone: user.phoneNumber,
        email,
        password_hash: passwordHash,
        role,
        verified_status: verifiedStatus,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError("Erreur lors de l'enregistrement : " + err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />

      {!showRegisterForm ? (
        <View style={styles.formContainer}>
          {!isCodeSent ? (
            <>
              <Text style={styles.label}>Numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 0612345678"
                placeholderTextColor="#888"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.button} onPress={handleSendVerificationCode}>
                <Text style={styles.buttonText}>Envoyer le code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Code de vérification</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez le code reçu par SMS"
                placeholderTextColor="#888"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
                <Text style={styles.buttonText}>Vérifier le code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  setIsCodeSent(false);
                  setVerificationCode('');
                  setError(null);
                }}
              >
                <Text style={styles.linkText}>Modifier le numéro</Text>
              </TouchableOpacity>
            </>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>Déjà un compte ? Connectez-vous</Text>
            </TouchableOpacity>
          </Link>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Adresse e-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: monemail@exemple.com"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mot de passe (hash)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: mon_password"
            placeholderTextColor="#888"
            value={passwordHash}
            onChangeText={setPasswordHash}
            secureTextEntry
          />

          <Text style={styles.label}>Rôle</Text>
          <Picker
            selectedValue={role}
            onValueChange={setRole}
            style={styles.input}
          >
            <Picker.Item label="Participant" value="participant" />
            <Picker.Item label="Organisateur" value="organisateur" />
          </Picker>

          <TouchableOpacity style={styles.button} onPress={handleRegisterUser}>
            <Text style={styles.buttonText}>Enregistrer</Text>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: '#111',
    padding: 24,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: '#333',
    borderWidth: 1,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0f0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#0f0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#0f0',
    fontSize: 14,
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});
