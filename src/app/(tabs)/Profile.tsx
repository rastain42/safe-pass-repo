import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useUserProfile } from '@/hooks/users/useUserProfile';
import { formatMissingValue } from '@/utils/format';

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
        <Text style={styles.title}>Profil</Text>        <View style={styles.infoContainer}>
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
            {userData?.profile?.firstName && userData?.profile?.lastName
              ? `${userData.profile.firstName} ${userData.profile.lastName}`
              : userData?.initialData
                ? `${userData.initialData.firstName} ${userData.initialData.lastName}`
                : 'Non renseigné'}
          </Text>
          {userData?.profile?.verified && (
            <Text style={styles.verifiedBadge}>✅ Vérifié automatiquement</Text>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Date de naissance</Text>
          <Text style={styles.value}>
            {userData?.profile?.birthDate || userData?.initialData?.birthDate || 'Non renseignée'}
          </Text>
          {userData?.profile?.birthDate && (
            <Text style={styles.extractedInfo}>📄 Extraite du document</Text>
          )}
        </View>

        {userData?.profile?.documentNumber && (
          <View style={styles.infoContainer}>
            <Text style={styles.label}>N° Document</Text>
            <Text style={styles.value}>{userData.profile.documentNumber}</Text>
            <Text style={styles.extractedInfo}>📄 Extraite du document</Text>
          </View>
        )}

        {userData?.profile?.verification_method && (
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Méthode de vérification</Text>
            <Text style={styles.value}>
              {userData.profile.verification_method === 'automatic'
                ? '🤖 Vérification automatique'
                : '👨‍💼 Vérification manuelle'
              }
            </Text>
            {userData?.profile?.verification_date && (
              <Text style={styles.extractedInfo}>
                📅 {new Date(userData.profile.verification_date.seconds * 1000).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>)}

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Rôle</Text>
          <Text style={styles.value}>{formatMissingValue(userData?.role)}</Text>
        </View>

        <View style={styles.verificationSection}>
          <View style={styles.verificationStatus}>
            <FontAwesome
              name={userData?.verification?.verification_status === 'auto_approved' || userData?.profile?.verified ? "check-circle" : "exclamation-circle"}
              size={24}
              color={userData?.verification?.verification_status === 'auto_approved' || userData?.profile?.verified ? "#0f0" : "#ff9800"}
            />
            <Text style={styles.verificationText}>
              {userData?.verification?.verification_status === 'auto_approved'
                ? "Identité vérifiée automatiquement"
                : userData?.profile?.verified
                  ? "Identité vérifiée"
                  : userData?.verification?.verification_status === 'pending'
                    ? "Vérification en cours"
                    : "Identité non vérifiée"}
            </Text>
          </View>

          {(!userData?.verification?.verification_status || userData?.verification?.verification_status === 'rejected') && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyIdentity}
            >
              <Text style={styles.verifyButtonText}>Vérifier mon identité</Text>
            </TouchableOpacity>
          )}

          {userData?.verification?.verification_status === 'pending' && (
            <View style={styles.pendingInfo}>
              <Text style={styles.pendingText}>
                📋 Votre demande est en cours d'examen par nos équipes.
                Vous recevrez une notification sous 24-48h.
              </Text>
            </View>
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
  }, value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  verifiedBadge: {
    color: '#0f0',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  }, extractedInfo: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  pendingInfo: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  pendingText: {
    color: '#ff9800',
    fontSize: 14,
    textAlign: 'center',
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