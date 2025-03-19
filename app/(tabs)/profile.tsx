import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const auth = getAuth();
  const user = auth.currentUser;

  const handleVerifyIdentity = () => {
    router.push('/screens/VerifyIdentityScreen');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/Login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.title}>Profil</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Téléphone</Text>
          <Text style={styles.value}>{user?.phoneNumber || 'Non renseigné'}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{userData?.email || 'Non renseigné'}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Nom</Text>
          <Text style={styles.value}>{`${userData?.firstName || ''} ${userData?.lastName || ''}`}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Date de naissance</Text>
          <Text style={styles.value}>{userData?.birthDate || 'Non renseigné'}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Rôle</Text>
          <Text style={styles.value}>{userData?.role || 'Non défini'}</Text>
        </View>
        <View style={styles.verificationSection}>
          <View style={styles.verificationStatus}>
            <FontAwesome
              name={userData?.isVerified ? "check-circle" : "exclamation-circle"}
              size={24}
              color={userData?.isVerified ? "#0f0" : "#ff9800"}
            />
            <Text style={styles.verificationText}>
              {userData?.isVerified
                ? "Identité vérifiée"
                : "Identité non vérifiée"}
            </Text>
          </View>

          {!userData?.isVerified && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyIdentity}
            >
              <Text style={styles.verifyButtonText}>Vérifier mon identité</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  verificationSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 20,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  verifyButton: {
    backgroundColor: '#0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  settingsContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});