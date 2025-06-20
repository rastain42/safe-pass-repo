import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { DataReconciliation, IdentityData } from '@/types/user';

interface DataReconciliationModalProps {
  visible: boolean;
  reconciliation: DataReconciliation;
  initialData: IdentityData;
  idData: IdentityData;
  onChoice: (choice: 'accept_id_data' | 'keep_initial_data' | 'retry_verification') => void;
  onCancel: () => void;
}

export default function DataReconciliationModal({
  visible,
  reconciliation,
  initialData,
  idData,
  onChoice,
  onCancel,
}: DataReconciliationModalProps) {
  const handleAcceptIdData = () => {
    Alert.alert(
      'Confirmer la mise à jour',
      "Vos informations seront mises à jour avec celles de votre pièce d'identité. Cette action est irréversible.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => onChoice('accept_id_data') },
      ]
    );
  };

  const handleKeepInitialData = () => {
    Alert.alert(
      'Garder les données actuelles',
      "Vos informations actuelles seront conservées. Vous devrez peut-être refaire la vérification d'identité.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => onChoice('keep_initial_data') },
      ]
    );
  };

  const handleRetryVerification = () => {
    Alert.alert(
      'Relancer la vérification',
      "Vous allez recommencer le processus de vérification d'identité.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Recommencer', onPress: () => onChoice('retry_verification') },
      ]
    );
  };

  const renderConflictItem = (
    label: string,
    initialValue: string,
    idValue: string,
    hasConflict: boolean
  ) => (
    <View style={styles.conflictItem}>
      <Text style={styles.conflictLabel}>{label}</Text>
      <View style={styles.conflictValues}>
        <View style={[styles.valueContainer, !hasConflict && styles.matchingValue]}>
          <Text style={styles.valueLabel}>Vos données actuelles :</Text>
          <Text style={[styles.valueText, !hasConflict && styles.matchingText]}>
            {initialValue}
          </Text>
        </View>
        <View style={[styles.valueContainer, !hasConflict && styles.matchingValue]}>
          <Text style={styles.valueLabel}>Données de la pièce d'identité :</Text>
          <Text style={[styles.valueText, !hasConflict && styles.matchingText]}>{idValue}</Text>
        </View>
      </View>
      {hasConflict && (
        <View style={styles.conflictIndicator}>
          <FontAwesome name='exclamation-triangle' size={16} color='#ff9800' />
          <Text style={styles.conflictText}>Différence détectée</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent={true} animationType='fade' onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <FontAwesome name='id-card' size={24} color='#0f0' />
            <Text style={styles.title}>Vérification des informations</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <FontAwesome name='times' size={20} color='#666' />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {reconciliation.hasConflicts ? (
              <>
                <Text style={styles.subtitle}>
                  Des différences ont été détectées entre vos informations et celles de votre pièce
                  d'identité.
                </Text>

                <View style={styles.conflictsContainer}>
                  {renderConflictItem(
                    'Prénom',
                    initialData.firstName,
                    idData.firstName,
                    !!reconciliation.conflicts.firstName
                  )}

                  {renderConflictItem(
                    'Nom',
                    initialData.lastName,
                    idData.lastName,
                    !!reconciliation.conflicts.lastName
                  )}

                  {renderConflictItem(
                    'Date de naissance',
                    initialData.birthDate,
                    idData.birthDate,
                    !!reconciliation.conflicts.birthDate
                  )}
                </View>

                <Text style={styles.instructions}>Que souhaitez-vous faire ?</Text>
              </>
            ) : (
              <>
                <Text style={styles.subtitle}>
                  ✅ Vos informations correspondent parfaitement à celles de votre pièce d'identité.
                </Text>
                <Text style={styles.instructions}>
                  Vos données seront automatiquement validées.
                </Text>
              </>
            )}
          </ScrollView>

          <View style={styles.actions}>
            {reconciliation.hasConflicts ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleAcceptIdData}
                >
                  <FontAwesome name='check' size={16} color='#fff' />
                  <Text style={styles.primaryButtonText}>
                    Utiliser les données de la pièce d'identité
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleKeepInitialData}
                >
                  <FontAwesome name='user' size={16} color='#0f0' />
                  <Text style={styles.secondaryButtonText}>Garder mes données actuelles</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.warningButton]}
                  onPress={handleRetryVerification}
                >
                  <FontAwesome name='refresh' size={16} color='#ff9800' />
                  <Text style={styles.warningButtonText}>Recommencer la vérification</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleAcceptIdData}
              >
                <FontAwesome name='check' size={16} color='#fff' />
                <Text style={styles.primaryButtonText}>Valider mes informations</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    margin: 16,
    lineHeight: 22,
  },
  instructions: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  conflictsContainer: {
    marginHorizontal: 16,
  },
  conflictItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  conflictLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  conflictValues: {
    gap: 8,
  },
  valueContainer: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
  },
  matchingValue: {
    backgroundColor: '#0a3a0a',
    borderColor: '#0f0',
  },
  valueLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  matchingText: {
    color: '#0f0',
  },
  conflictIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  conflictText: {
    fontSize: 12,
    color: '#ff9800',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#0f0',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#0f0',
  },
  secondaryButtonText: {
    color: '#0f0',
    fontSize: 16,
    fontWeight: '500',
  },
  warningButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  warningButtonText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '500',
  },
});
