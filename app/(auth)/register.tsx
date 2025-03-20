import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';

// Import des services et hooks
import { firebaseConfig } from '@/firebase/config';
import { sendVerificationCode, verifyPhoneCode } from '@/services/auth.service';
import { createUserProfile, checkEmailExists } from '@/services/user.service';
import { useForm, validators } from '@/hooks/useForm';
import CustomModal from '@/components/design/CustomModal';
import { auth } from '@/firebase/config';
import { signInWithCredential } from 'firebase/auth';
import { formatPhone } from '@/utils/formatting';

export default function RegisterScreen() {
  // Refs
  const router = useRouter();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // États UI et navigation
  const [verificationId, setVerificationId] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState<string>('');



  // Formulaire téléphone
  const phoneForm = useForm({
    initialValues: {
      phoneNumber: '',
      verificationCode: '',
    },
    validators: {
      phoneNumber: validators.phone('Format de numéro invalide'),
      verificationCode: validators.required('Code requis'),
    },
  });

  // Formulaire inscription
  const registerForm = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      birthDate: '',
      role: 'participant',
    },
    validators: {
      email: validators.email(),
      password: validators.password(),
      firstName: validators.minLength(2),
      lastName: validators.minLength(2),
      birthDate: validators.required(),
    },
    onSubmit: handleRegisterUser,
  });

  // Animations
  const fadeOut = async () => {
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

  // Navigation vers l'écran d'aide
  const handleSupportRequest = () => {
    router.push('/screens/SupportScreen');
  };

  /**
   * Envoyer le code de vérification au numéro de téléphone
   */
  async function handleSendVerificationCode() {
    try {
      setLoading(true);
      setError(null);

      // Valider le numéro de téléphone
      const phoneNumber = phoneForm.fields.phoneNumber.value;
      if (!phoneNumber.trim()) {
        setError('Veuillez entrer un numéro de téléphone');
        return;
      }

      // Envoyer le code de vérification
      const vId = await sendVerificationCode(
        phoneNumber,
        recaptchaVerifier,
      );

      setVerificationId(vId);

      // Animation de transition
      await fadeOut();
      setIsCodeSent(true);
      fadeIn();

    } catch (err: any) {
      console.error('Erreur lors de l\'envoi du code:', err);

      // Messages d'erreur spécifiques selon le code d'erreur
      if (err.code === 'auth/invalid-phone-number') {
        setError('Numéro de téléphone invalide');
      } else if (err.code === 'auth/network-request-failed') {
        setError(`Erreur réseau. Vérifiez votre connexion Internet.`);
      } else if (err.message === 'phone_exists') {
        setError('Ce numéro de téléphone est déjà utilisé');
      } else {
        setError(`Erreur: ${err.message || 'Veuillez réessayer'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  /**
   * Vérifier le code reçu par SMS
   */
  async function handleVerifyCode() {
    try {
      setLoading(true);
      setError(null);

      const verificationCode = phoneForm.fields.verificationCode.value;
      if (!verificationCode.trim()) {
        setError('Veuillez entrer le code de vérification');
        return;
      }

      // Vérifier le code et récupérer l'identifiant utilisateur
      const credential = await verifyPhoneCode(
        verificationId,
        verificationCode,
        formatPhone(phoneForm.fields.phoneNumber.value)
      );

      // Créer l'utilisateur avec le credential
      const userCredential = await signInWithCredential(auth, credential);

      // Stocker l'ID utilisateur
      setUserId(userCredential.user.uid);

      // Animation de transition
      await fadeOut();
      setShowRegisterForm(true);

      // Retard avant de réactiver le formulaire
      setTimeout(() => fadeIn(), 300);

    } catch (err: any) {
      // Gestion d'erreur
    } finally {
      setLoading(false);
    }
  }
  async function handleRegisterUser() {
    try {
      // Validation manuelle des mots de passe
      if (registerForm.fields.password.value !== registerForm.fields.confirmPassword.value) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }

      // Valider le formulaire complet
      if (!registerForm.validateForm()) {
        return;
      }

      setLoading(true);
      setError(null);

      // Vérifier si l'email existe déjà
      const emailExists = await checkEmailExists(registerForm.fields.email.value);
      if (emailExists) {
        setError("Cette adresse email est déjà utilisée");
        setLoading(false);
        return;
      }

      // Convertir la date de naissance
      let birthDate;
      if (registerForm.fields.birthDate.value) {
        const [day, month, year] = registerForm.fields.birthDate.value.split('/');
        birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        birthDate = null;
      }

      // Créer le profil utilisateur
      await createUserProfile({
        userId, // Inclure l'ID utilisateur
        firstName: registerForm.fields.firstName.value,
        lastName: registerForm.fields.lastName.value,
        email: registerForm.fields.email.value.toLowerCase().trim(),
        phone: formatPhone(phoneForm.fields.phoneNumber.value),
        birthDate, // Date convertie
        password: registerForm.fields.password.value,
        role: registerForm.fields.role.value
      });

      setShowSuccessModal(true);

    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement:", err);
      setError("Erreur lors de l'enregistrement : " + (err.message || 'Veuillez réessayer'));
    } finally {
      setLoading(false);
    }
  }

  // Gérer les entrées avec moins de scroll auto
  const handleInputFocus = (position: number) => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: position, animated: true });
      }, 200);
    }
  };

  // Fermer la modale de succès et rediriger
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.replace('/(tabs)/Index');
  };

  // Sélectionner une date de naissance
  const handleDateSelect = (date: Date) => {
    registerForm.setFieldValue('birthDate', format(date, 'dd/MM/yyyy'));
    setDatePickerVisibility(false);
  };

  // Gérer le retour à la modification du numéro
  const handleBackToPhone = async () => {
    if (loading) return;
    setLoading(true);
    await fadeOut();
    setIsCodeSent(false);
    phoneForm.setFieldValue('verificationCode', '');
    setError(null);
    fadeIn();
    setLoading(false);
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
                  value={phoneForm.fields.phoneNumber.value}
                  onChangeText={(text) => phoneForm.setFieldValue('phoneNumber', text)}
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
                  value={phoneForm.fields.verificationCode.value}
                  onChangeText={(text) => phoneForm.setFieldValue('verificationCode', text)}
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
                  onPress={handleBackToPhone}
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
                  value={registerForm.fields.email.value}
                  onChangeText={(text) => registerForm.setFieldValue('email', text)}
                  onBlur={() => registerForm.handleBlur('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => handleInputFocus(0)}
                  editable={!loading}
                  autoComplete="email"
                />
                {registerForm.fields.email.error && (
                  <Text style={styles.fieldError}>{registerForm.fields.email.error}</Text>
                )}

                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="Mot de passe"
                  placeholderTextColor="#888"
                  value={registerForm.fields.password.value}
                  onChangeText={(text) => registerForm.setFieldValue('password', text)}
                  onBlur={() => registerForm.handleBlur('password')}
                  secureTextEntry
                  onFocus={() => handleInputFocus(60)}
                  editable={!loading}
                  autoComplete="password-new"
                />
                {registerForm.fields.password.error && (
                  <Text style={styles.fieldError}>{registerForm.fields.password.error}</Text>
                )}

                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="Confirmez votre mot de passe"
                  placeholderTextColor="#888"
                  value={registerForm.fields.confirmPassword.value}
                  onChangeText={(text) => registerForm.setFieldValue('confirmPassword', text)}
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
                  value={registerForm.fields.firstName.value}
                  onChangeText={(text) => registerForm.setFieldValue('firstName', text)}
                  onBlur={() => registerForm.handleBlur('firstName')}
                  onFocus={() => handleInputFocus(220)}
                  editable={!loading}
                  autoComplete="name-given"
                />
                {registerForm.fields.firstName.error && (
                  <Text style={styles.fieldError}>{registerForm.fields.firstName.error}</Text>
                )}

                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={[styles.input, { color: '#fff' }]}
                  placeholder="Ex: Dupont"
                  placeholderTextColor="#888"
                  value={registerForm.fields.lastName.value}
                  onChangeText={(text) => registerForm.setFieldValue('lastName', text)}
                  onBlur={() => registerForm.handleBlur('lastName')}
                  onFocus={() => handleInputFocus(280)}
                  editable={!loading}
                  autoComplete="name-family"
                />
                {registerForm.fields.lastName.error && (
                  <Text style={styles.fieldError}>{registerForm.fields.lastName.error}</Text>
                )}

                <Text style={styles.label}>Date de naissance</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => !loading && setDatePickerVisibility(true)}
                  disabled={loading}
                >
                  <Text style={{ color: registerForm.fields.birthDate.value ? '#fff' : '#888' }}>
                    {registerForm.fields.birthDate.value || 'Sélectionner une date'}
                  </Text>
                </TouchableOpacity>
                {registerForm.fields.birthDate.error && (
                  <Text style={styles.fieldError}>{registerForm.fields.birthDate.error}</Text>
                )}

                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="date"
                  maximumDate={new Date()}
                  onConfirm={handleDateSelect}
                  onCancel={() => setDatePickerVisibility(false)}
                />

                <Text style={styles.label}>Rôle</Text>
                <View style={[styles.input, { paddingVertical: 0, paddingHorizontal: 0 }]}>
                  <Picker
                    selectedValue={registerForm.fields.role.value}
                    onValueChange={(value) => !loading && registerForm.setFieldValue('role', value)}
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
                  onPress={() => registerForm.submitForm()}
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
  fieldError: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    textAlign: 'left',
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