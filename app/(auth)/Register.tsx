import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeFirebaseRecaptcha } from '@/components/auth/SafeFirebaseRecaptcha';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';

// Config et hooks
import { firebaseConfig } from '@/firebase/config';
import { useRegistration } from '@/hooks/useRegistration';
import CustomModal from '@/components/design/CustomModal';

export default function RegisterScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    // États
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    birthDate,
    setBirthDate,
    role,
    setRole,
    isCodeSent,
    showRegisterForm,
    error,
    loading,
    isDatePickerVisible,
    showSuccessModal,
    fadeAnim,
    recaptchaVerifier,

    // Méthodes
    handleSendVerificationCode,
    handleVerifyCode,
    handleRegisterUser,
    reset,
    handleSupportRequest,
    setDatePickerVisibility,
    handleCloseSuccessModal
  } = useRegistration(router);

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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      <SafeFirebaseRecaptcha
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
                  onPress={reset}
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