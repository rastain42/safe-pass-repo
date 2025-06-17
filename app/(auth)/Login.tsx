import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { firebaseConfig } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { navigateToSupport, navigateToRegister } from '@/utils/navigation';

export default function LoginScreen() {
  const {
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    password,
    setPassword,
    isCodeSent,
    isCodeVerified,
    error,
    loading,
    recaptchaVerifier,
    handleSendVerificationCode, handleVerifyCode,
    handleLogin,
    reset
  } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={true}
        title="Vérification reCAPTCHA"
        cancelLabel="Annuler"
      />
      <View style={styles.formContainer}>
        {!isCodeSent ? (
          // Étape 1: Numéro de téléphone
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
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Envoyer le code</Text>
              )}
            </TouchableOpacity>
          </>
        ) : !isCodeVerified ? (
          // Étape 2: Code de vérification
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
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Vérifier le code</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={reset}
              disabled={loading}
            >
              <Text style={[styles.linkText, loading && styles.disabledText]}>
                Modifier le numéro
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Étape 3: Mot de passe
          <>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre mot de passe"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              autoComplete="password"
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={navigateToSupport}
              disabled={loading}
            >
              <Text style={styles.linkText}>J'ai oublié mon mot de passe</Text>
            </TouchableOpacity>
          </>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {error && error.includes("pas enregistré") && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={navigateToRegister}
          >
            <Text style={styles.linkText}>S'inscrire maintenant</Text>
          </TouchableOpacity>
        )}

        {!isCodeVerified && (
          <>
            <TouchableOpacity
              style={styles.linkButton}
              disabled={loading}
              onPress={navigateToRegister}
            >
              <Text style={[styles.linkText, loading && styles.disabledText]}>
                Pas de compte ? Inscrivez-vous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={navigateToSupport}
              disabled={loading}
            >
              <Text style={[styles.linkText, loading && styles.disabledText]}>
                J'ai un souci pour me connecter
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
    backgroundColor: '#0a0',
    opacity: 0.7,
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
    opacity: 0.5,
  },
  errorText: {
    color: '#ff4444',
    marginTop: 16,
    textAlign: 'center',
  },
});