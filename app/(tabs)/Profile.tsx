import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatMissingValue, formatFullName } from '@/utils/format';

export default function ProfileScreen() {
  const { userData, user, loading, handleLogout, handleVerifyIdentity } = useUserProfile();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0f0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.title}>Profil</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Téléphone</Text>
          <Text style={styles.value}>{formatMissingValue(user?.phoneNumber)}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{formatMissingValue(userData?.email)}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Nom</Text>
          <Text style={styles.value}>
            {formatFullName(userData?.firstName, userData?.lastName)}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Date de naissance</Text>
          <Text style={styles.value}>{formatMissingValue(userData?.birthDate)}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Rôle</Text>
          <Text style={styles.value}>{formatMissingValue(userData?.role)}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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