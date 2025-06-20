import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { FontAwesome } from '@expo/vector-icons';

// Type pour gérer les différentes sections
type SupportSection = 'menu' | 'contact' | 'phoneChange' | 'passwordReset';

export default function SupportScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SupportSection>('menu');

  // États du formulaire de contact
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  // États pour le changement de numéro
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [oldPhoneNumber, setOldPhoneNumber] = useState('');

  // États pour la réinitialisation de mot de passe
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSendRequest = () => {
    // Simuler l'envoi d'une demande
    setTimeout(() => {
      setSent(true);
    }, 1000);
  };

  const handlePasswordReset = async () => {
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (error) {
      console.error("Erreur lors de l'envoi du mail de réinitialisation", error);
    }
  };

  const renderMenu = () => {
    return (
      <View style={styles.menuContainer}>
        <Text style={styles.description}>Comment pouvons-nous vous aider ?</Text>

        <TouchableOpacity style={styles.menuButton} onPress={() => setActiveSection('contact')}>
          <FontAwesome name='envelope' size={20} color='#0f0' style={styles.icon} />
          <Text style={styles.menuButtonText}>Contacter le support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => setActiveSection('phoneChange')}>
          <FontAwesome name='phone' size={20} color='#0f0' style={styles.icon} />
          <Text style={styles.menuButtonText}>J'ai changé de numéro de téléphone</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setActiveSection('passwordReset')}
        >
          <FontAwesome name='lock' size={20} color='#0f0' style={styles.icon} />
          <Text style={styles.menuButtonText}>J'ai oublié mon mot de passe</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContactForm = () => {
    return (
      <>
        {!sent ? (
          <>
            <Text style={styles.sectionTitle}>Contacter le support</Text>
            <Text style={styles.description}>
              Décrivez votre problème et nous vous répondrons sous 48h.
            </Text>

            <Text style={styles.label}>Votre email</Text>
            <TextInput
              style={styles.input}
              placeholder='exemple@email.com'
              placeholderTextColor='#888'
              value={email}
              onChangeText={setEmail}
              keyboardType='email-address'
            />

            <Text style={styles.label}>Décrivez votre problème</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder='Détaillez votre problème...'
              placeholderTextColor='#888'
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.button} onPress={handleSendRequest}>
              <Text style={styles.buttonText}>Envoyer</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successContainer}>
            <FontAwesome name='check-circle' size={50} color='#0f0' style={styles.successIcon} />
            <Text style={styles.successText}>Votre demande a bien été envoyée !</Text>
            <Text style={styles.descriptionLight}>
              Notre équipe vous contactera dans les plus brefs délais.
            </Text>
          </View>
        )}
      </>
    );
  };

  const renderPhoneChange = () => {
    return (
      <>
        <Text style={styles.sectionTitle}>Changement de numéro</Text>
        <Text style={styles.description}>
          Si vous avez changé de numéro de téléphone, fournissez-nous les informations suivantes :
        </Text>

        <Text style={styles.label}>Ancien numéro de téléphone</Text>
        <TextInput
          style={styles.input}
          placeholder='Ex: 06 12 34 56 78'
          placeholderTextColor='#888'
          value={oldPhoneNumber}
          onChangeText={setOldPhoneNumber}
          keyboardType='phone-pad'
        />

        <Text style={styles.label}>Nouveau numéro de téléphone</Text>
        <TextInput
          style={styles.input}
          placeholder='Ex: 07 65 43 21 09'
          placeholderTextColor='#888'
          value={newPhoneNumber}
          onChangeText={setNewPhoneNumber}
          keyboardType='phone-pad'
        />

        <Text style={styles.label}>Votre email</Text>
        <TextInput
          style={styles.input}
          placeholder='exemple@email.com'
          placeholderTextColor='#888'
          value={email}
          onChangeText={setEmail}
          keyboardType='email-address'
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            // Simulation d'envoi de demande
            setTimeout(() => setSent(true), 1000);
          }}
        >
          <Text style={styles.buttonText}>Envoyer la demande</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderPasswordReset = () => {
    return (
      <>
        <Text style={styles.sectionTitle}>Mot de passe oublié</Text>

        {!resetSent ? (
          <>
            <Text style={styles.description}>
              Entrez l'email associé à votre compte pour recevoir un lien de réinitialisation.
            </Text>

            <Text style={styles.label}>Votre email</Text>
            <TextInput
              style={styles.input}
              placeholder='exemple@email.com'
              placeholderTextColor='#888'
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType='email-address'
            />

            <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
              <Text style={styles.buttonText}>Réinitialiser le mot de passe</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successContainer}>
            <FontAwesome name='check-circle' size={50} color='#0f0' style={styles.successIcon} />
            <Text style={styles.successText}>Email de réinitialisation envoyé !</Text>
            <Text style={styles.descriptionLight}>
              Vérifiez votre boîte de réception et suivez les instructions.
            </Text>
          </View>
        )}
      </>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'contact':
        return renderContactForm();
      case 'phoneChange':
        return renderPhoneChange();
      case 'passwordReset':
        return renderPasswordReset();
      default:
        return renderMenu();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assistance</Text>

      <View style={styles.formContainer}>
        {renderContent()}

        {activeSection !== 'menu' && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              setActiveSection('menu');
              setSent(false);
              setResetSent(false);
            }}
          >
            <Text style={styles.linkText}>Retour au menu</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.linkButton, { marginTop: 8 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.linkText}>Retour à la connexion</Text>
        </TouchableOpacity>
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
  menuContainer: {
    alignItems: 'center',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    borderColor: '#333',
    borderWidth: 1,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  icon: {
    marginRight: 16,
  },
  sectionTitle: {
    color: '#0f0',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  descriptionLight: {
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
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
  textArea: {
    height: 100,
    ...(Platform.OS === 'android' && { textAlignVertical: 'top' }),
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    color: '#0f0',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  successIcon: {
    marginBottom: 16,
  },
});
