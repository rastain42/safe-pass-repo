import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import * as Crypto from 'expo-crypto';

// Import depuis notre configuration Firebase mise à jour
import { auth, db, firebaseConfig, saveAuthData } from '../../firebase/config';
import CustomModal from '@/components/design/CustomModal';

export default function RegisterScreen() {
  const router = useRouter();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [role, setRole] = useState('participant');
  const [verifiedStatus, setVerifiedStatus] = useState('non_verified');

  // Animation pour les transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fonction d'animation pour transitions douces
  const fadeOut = () => {
    return new Promise<void>((resolve) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Fonction pour hacher le mot de passe avec SHA-256 et sel
  const hashPassword = async (password: string, uid: string) => {
    // Utilisation de l'ID utilisateur comme sel pour renforcer la sécurité
    const salt = uid.slice(0, 16);
    const passwordWithSalt = password + salt;

    // Utilise expo-crypto pour créer un hash SHA-256
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      passwordWithSalt
    );

    return { hash, salt };
  };

  const checkPhoneNumberExists = async (phoneNumber: string) => {
    const formattedPhone = formatPhone(phoneNumber);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', formattedPhone));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  };

  const checkEmailExists = async (email: string) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  };

  const formatPhone = (phone: string): string => {
    const cleaned = phone.trim().replace(/\s/g, '').replace(/[()-]/g, '');

    return !cleaned.startsWith('+')
      ? cleaned.startsWith('0')
        ? `+33${cleaned.slice(1)}`
        : `+33${cleaned}`
      : cleaned;
  };

  const handleSupportRequest = () => {
    router.push('/screens/SupportScreen');
  };

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      setError('Veuillez entrer un numéro de téléphone');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formattedPhone = formatPhone(phoneNumber);

      // Vérifier si le numéro existe déjà
      const exists = await checkPhoneNumberExists(formattedPhone);
      if (exists) {
        setError('Ce numéro de téléphone est déjà utilisé');
        setLoading(false);
        return;
      }

      const provider = new PhoneAuthProvider(auth);
      const vId = await provider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier.current as any
      );

      setVerificationId(vId);

      // Attendre que fadeOut se termine
      await fadeOut();
      setIsCodeSent(true);
      fadeIn();
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi du code:', err);

      if (err.code === 'auth/invalid-phone-number') {
        setError('Numéro de téléphone invalide');
      } else if (err.code === 'auth/network-request-failed') {
        setError(`Erreur réseau. Vérifiez votre connexion Internet.`);
      } else {
        setError(`Erreur: ${err.message || 'Veuillez réessayer'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Veuillez entrer le code de vérification');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);

      // Authentification
      await signInWithCredential(auth, credential);
      setVerifiedStatus('verified');

      // Sauvegarder le numéro de téléphone vérifié
      const currentUser = auth.currentUser;
      if (currentUser) {
        await saveAuthData('verifiedPhone', currentUser.phoneNumber || formatPhone(phoneNumber));
      }

      // Animation de transition
      await fadeOut();

      // Une fois que l'animation de fondu est terminée, on change l'état
      setShowRegisterForm(true);

      // Retard avant de réactiver le formulaire pour éviter les problèmes de rendu
      setTimeout(() => {
        fadeIn();
      }, 300);
    } catch (err: any) {
      console.error('Erreur de vérification:', err);
      setError(err.code === 'auth/invalid-verification-code'
        ? "Code de vérification incorrect"
        : "Erreur de vérification : " + (err.message || 'Veuillez réessayer'));
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): boolean => {
    // Au moins 8 caractères, une majuscule, un chiffre et un caractère spécial
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return minLength && hasUpperCase && hasNumber && hasSpecialChar;
  };

  const validateForm = async (): Promise<boolean> => {
    // Vérifier l'email
    if (!email.trim()) {
      setError("Veuillez entrer une adresse email");
      return false;
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format d'email invalide");
      return false;
    }

    // Vérifier si l'email existe déjà
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      setError("Cette adresse email est déjà utilisée");
      return false;
    }

    // Valider le mot de passe
    if (!validatePassword(password)) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial");
      return false;
    }

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }

    // Vérifier le prénom et le nom
    if (!firstName || firstName.length < 2) {
      setError("Veuillez entrer un prénom valide (au moins 2 caractères)");
      return false;
    }

    if (!lastName || lastName.length < 2) {
      setError("Veuillez entrer un nom valide (au moins 2 caractères)");
      return false;
    }

    // Vérifier la date de naissance
    if (!birthDate) {
      setError("Veuillez sélectionner votre date de naissance");
      return false;
    }

    return true;
  };

  const handleRegisterUser = async () => {
    try {
      // Valider le formulaire
      const isValid = await validateForm();
      if (!isValid) {
        return;
      }

      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Impossible de récupérer l'utilisateur après vérification.");
        setLoading(false);
        return;
      }

      // Hacher le mot de passe avec le sel (uid)
      const { hash: passwordHash, salt: passwordSalt } = await hashPassword(password, currentUser.uid);

      const userRef = doc(db, 'users', currentUser.uid);
      const userData = {
        phone: currentUser.phoneNumber || formatPhone(phoneNumber),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        password_salt: passwordSalt,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate,
        role: role,
        verified_status: verifiedStatus,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await setDoc(userRef, userData);

      // Sauvegarder les données dans SecureStore pour la persistance
      await saveAuthData('userId', currentUser.uid);
      await saveAuthData('userFirstName', firstName.trim());
      await saveAuthData('userLastName', lastName.trim());
      await saveAuthData('userBirthDate', birthDate);
      await saveAuthData('userEmail', email.toLowerCase().trim());
      await saveAuthData('userRole', role);
      await saveAuthData('lastLogin', new Date().toISOString());

      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement:", err);
      setError("Erreur lors de l'enregistrement : " + (err.message || 'Veuillez réessayer'));
      setLoading(false);
    }
  };

  // Gestion des entrées avec moins de scroll auto
  const handleInputFocus = (position: number) => {
    if (scrollViewRef.current) {
      // Ajouter un délai pour s'assurer que le clavier est visible
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: position,
          animated: true
        });
      }, 200);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.replace('/(tabs)/Index');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={true}
        title='Vérification reCAPTCHA'
        cancelLabel='Annuler'
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0f0" />
          <Text style={styles.loadingText}>Traitement en cours...</Text>
        </View>
      )}

      <Animated.View style={[{ opacity: fadeAnim, width: '100%', alignItems: 'center' }]}>
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
                  editable={!loading}
                  autoComplete="tel"
                />
                <TouchableOpacity
                  style={[styles.button, loading && styles.disabledButton]}
                  onPress={handleSendVerificationCode}
                  disabled={loading}
                >
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
                  editable={!loading}
                  autoComplete="sms-otp"
                />
                <TouchableOpacity
                  style={[styles.button, loading && styles.disabledButton]}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Vérifier le code</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={async () => {
                    if (loading) return;
                    setLoading(true);
                    await fadeOut();
                    setIsCodeSent(false);
                    setVerificationCode('');
                    setError(null);
                    fadeIn();
                    setLoading(false);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.linkText}>Modifier le numéro</Text>
                </TouchableOpacity>
              </>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Link href="/(auth)/Login" asChild>
              <TouchableOpacity style={styles.linkButton} disabled={loading}>
                <Text style={[styles.linkText, loading && styles.disabledText]}>
                  Déjà un compte ? Connectez-vous
                </Text>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleSupportRequest}
              disabled={loading}
            >
              <Text style={[styles.linkText, loading && styles.disabledText]}>
                J'ai un souci pour m'inscrire
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
            keyboardVerticalOffset={50}
          >
            <ScrollView
              ref={scrollViewRef}
              style={{ width: '100%' }}
              contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formContainer}>
                <Text style={styles.label}>Adresse e-mail</Text>
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="Ex: monemail@exemple.com"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => handleInputFocus(0)}
                  editable={!loading}
                  autoComplete="email"
                />

                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="Mot de passe"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => handleInputFocus(60)}
                  editable={!loading}
                  autoComplete="password-new"
                />

                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="Confirmez votre mot de passe"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  onFocus={() => handleInputFocus(120)}
                  editable={!loading}
                  autoComplete="password-new"
                />

                <Text style={styles.passwordRequirements}>
                  Le mot de passe doit contenir au moins 8 caractères, une majuscule,
                  un chiffre et un caractère spécial
                </Text>

                <Text style={styles.label}>Prénom</Text>
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="Ex: Jean"
                  placeholderTextColor="#888"
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => handleInputFocus(220)}
                  editable={!loading}
                  autoComplete="name-given"
                />

                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="Ex: Dupont"
                  placeholderTextColor="#888"
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => handleInputFocus(280)}
                  editable={!loading}
                  autoComplete="name-family"
                />

                <Text style={styles.label}>Date de naissance</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => !loading && setDatePickerVisibility(true)}
                  disabled={loading}
                >
                  <Text style={{ color: birthDate ? '#fff' : '#888' }}>
                    {birthDate || 'Sélectionner une date'}
                  </Text>
                </TouchableOpacity>

                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="date"
                  maximumDate={new Date()} // Pas de date future
                  onConfirm={(date) => {
                    setBirthDate(format(date, 'dd/MM/yyyy'));
                    setDatePickerVisibility(false);
                  }}
                  onCancel={() => setDatePickerVisibility(false)}
                />

                <Text style={styles.label}>Rôle</Text>
                <View style={[styles.input, { paddingVertical: 0, paddingHorizontal: 0 }]}>
                  <Picker
                    selectedValue={role}
                    onValueChange={(value) => !loading && setRole(value)}
                    style={{ color: '#fff', backgroundColor: 'transparent' }}
                    dropdownIconColor="#fff"
                    enabled={!loading}
                  >
                    <Picker.Item label="Participant" value="participant" />
                    <Picker.Item label="Organisateur" value="organisateur" />
                  </Picker>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.disabledButton]}
                  onPress={handleRegisterUser}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Enregistrer</Text>
                </TouchableOpacity>

                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Animated.View>
      <CustomModal
        visible={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title="Inscription réussie"
        message="Votre compte a été créé avec succès! Vous allez être redirigé vers l'accueil."
        type="success"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles inchangés
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
  disabledButton: {
    backgroundColor: '#0a7a0a',
    shadowOpacity: 0.2,
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
  disabledText: {
    color: '#0a7a0a',
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  passwordRequirements: {
    color: '#888',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    textAlign: 'left',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
});