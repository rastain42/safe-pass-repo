import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MRZValidationResult } from '@/services/identity/mrz.service';

interface MRZValidationDisplayProps {
    mrzValidation: MRZValidationResult;
    crossValidation?: {
        matches: boolean;
        discrepancies: string[];
        confidence: number;
    };
}

export default function MRZValidationDisplay({
    mrzValidation,
    crossValidation
}: MRZValidationDisplayProps) {
    const getStatusIcon = (isValid: boolean) => {
        return isValid ? (
            <FontAwesome name="check-circle" size={20} color="#0f0" />
        ) : (
            <FontAwesome name="times-circle" size={20} color="#ff4444" />
        );
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return '#0f0';
        if (confidence >= 0.6) return '#ffa500';
        return '#ff4444';
    };

    return (
        <ScrollView style={styles.container}>
            {/* Statut général */}
            <View style={styles.section}>
                <View style={styles.header}>
                    {getStatusIcon(mrzValidation.isValid)}
                    <Text style={styles.headerText}>
                        {mrzValidation.isValid ? 'Document Authentique' : 'Document Suspect'}
                    </Text>
                </View>

                <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>Niveau de confiance:</Text>
                    <Text style={[
                        styles.confidenceValue,
                        { color: getConfidenceColor(mrzValidation.confidence) }
                    ]}>
                        {Math.round(mrzValidation.confidence * 100)}%
                    </Text>
                </View>
            </View>

            {/* Données MRZ */}
            {mrzValidation.data && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Données MRZ Extraites</Text>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Type de document:</Text>
                        <Text style={styles.dataValue}>{mrzValidation.data.documentType}</Text>
                    </View>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Pays émetteur:</Text>
                        <Text style={styles.dataValue}>{mrzValidation.data.countryCode}</Text>
                    </View>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Nom:</Text>
                        <Text style={styles.dataValue}>{mrzValidation.data.lastName}</Text>
                    </View>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Prénom:</Text>
                        <Text style={styles.dataValue}>{mrzValidation.data.firstName}</Text>
                    </View>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Numéro de document:</Text>
                        <Text style={styles.dataValue}>{mrzValidation.data.documentNumber}</Text>
                    </View>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Date de naissance:</Text>
                        <Text style={styles.dataValue}>{mrzValidation.data.birthDate}</Text>
                    </View>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Date d'expiration:</Text>
                        <Text style={styles.dataValue}>{mrzValidation.data.expirationDate}</Text>
                    </View>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Checksum valide:</Text>
                        <View style={styles.statusContainer}>
                            {getStatusIcon(mrzValidation.data.checksumValid)}
                            <Text style={[
                                styles.statusText,
                                { color: mrzValidation.data.checksumValid ? '#0f0' : '#ff4444' }
                            ]}>
                                {mrzValidation.data.checksumValid ? 'Valide' : 'Invalide'}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Validation croisée */}
            {crossValidation && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Validation Croisée OCR ↔ MRZ</Text>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Correspondance:</Text>
                        <View style={styles.statusContainer}>
                            {getStatusIcon(crossValidation.matches)}
                            <Text style={[
                                styles.statusText,
                                { color: crossValidation.matches ? '#0f0' : '#ff4444' }
                            ]}>
                                {crossValidation.matches ? 'Concordance' : 'Divergences détectées'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Confiance croisée:</Text>
                        <Text style={[
                            styles.confidenceValue,
                            { color: getConfidenceColor(crossValidation.confidence) }
                        ]}>
                            {Math.round(crossValidation.confidence * 100)}%
                        </Text>
                    </View>

                    {crossValidation.discrepancies.length > 0 && (
                        <View style={styles.discrepanciesContainer}>
                            <Text style={styles.discrepanciesTitle}>Divergences détectées:</Text>
                            {crossValidation.discrepancies.map((discrepancy, index) => (
                                <Text key={index} style={styles.discrepancyText}>
                                    • {discrepancy}
                                </Text>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Erreurs */}
            {mrzValidation.errors.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.errorTitle}>Problèmes détectés:</Text>
                    {mrzValidation.errors.map((error, index) => (
                        <View key={index} style={styles.errorContainer}>
                            <FontAwesome name="warning" size={16} color="#ffa500" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    section: {
        backgroundColor: '#111',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    sectionTitle: {
        color: '#0f0',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    confidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    confidenceLabel: {
        color: '#aaa',
        fontSize: 14,
    },
    confidenceValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    dataLabel: {
        color: '#aaa',
        fontSize: 14,
        flex: 1,
    },
    dataValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    discrepanciesContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#ffa500',
    },
    discrepanciesTitle: {
        color: '#ffa500',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    discrepancyText: {
        color: '#fff',
        fontSize: 12,
        marginBottom: 4,
    },
    errorTitle: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    errorText: {
        color: '#ffa500',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
});
