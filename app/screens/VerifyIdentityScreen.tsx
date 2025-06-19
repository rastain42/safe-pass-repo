import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { analyzeIdDocument, type AnalysisResult } from '../../services/documentAnalysis.service';
import { compareFaces, type BiometricComparisonResult } from '../../services/biometric.service';
import { cleanupSelfieAfterVerification } from '../../services/privacy.service';
import { cleanupAllUserTempFiles } from '../../services/cleanup.service';
import MRZValidationDisplay from '../../components/identity/MRZValidationDisplay';

export default function VerifyIdentityScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [idFront, setIdFront] = useState<string | null>(null); const [selfie, setSelfie] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [biometricResult, setBiometricResult] = useState<BiometricComparisonResult | null>(null);
  const [comparingFaces, setComparingFaces] = useState(false);
  const pickImage = async (setter: (value: string | null) => void, isSelfie: boolean = false) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la caméra');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: isSelfie ? [3, 4] : [4, 3], // Portrait pour selfie, paysage pour document
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setter(result.assets[0].uri);        // Si c'est le recto de la carte, analyser automatiquement
        if (setter === setIdFront) {
          await handleAnalyzeDocument(result.assets[0].uri);
        }

        // Si c'est un selfie et qu'on a déjà le document, comparer les visages
        if (setter === setSelfie && idFront) {
          await handleBiometricComparison(idFront, result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la capture d\'image:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra. Veuillez réessayer.');
    }
  };

  const uploadImage = async (uri: string, path: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storage = getStorage();
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const newProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(newProgress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleAnalyzeDocument = async (imageUri: string) => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    setAnalyzing(true);

    try {
      console.log('=== Début analyse document ===');

      // Utiliser la fonction analyzeIdDocument du service
      const result = await analyzeIdDocument(imageUri, auth.currentUser.uid);

      console.log('Résultat analyse:', result);
      setAnalysisResult(result);

      if (result.success && result.confidence > 0.7) {
        const firstName = result.data.firstName?.value || 'Non détecté';
        const lastName = result.data.lastName?.value || 'Non détecté';
        const confidence = Math.round(result.confidence * 100);

        Alert.alert(
          'Document analysé automatiquement ✅',
          `Prénom: ${firstName}\nNom: ${lastName}\nConfiance: ${confidence}%\n\nVous pouvez continuer la vérification.`,
          [{ text: 'Continuer', onPress: () => console.log('Analyse réussie') }]
        );
      } else if (result.success) {
        Alert.alert(
          'Analyse partielle ⚠️',
          `Le document a été analysé mais avec une confiance faible (${Math.round(result.confidence * 100)}%).\n\nLa vérification manuelle sera effectuée.`,
          [{ text: 'Continuer' }]
        );
      } else {
        Alert.alert(
          'Analyse échouée ❌',
          'Le document n\'a pas pu être analysé automatiquement.\n\nLa vérification manuelle sera effectuée.',
          [{ text: 'Continuer' }]
        );
      }

    } catch (error) {
      console.error('Erreur analyse:', error);

      // Gestion des erreurs spécifiques
      let errorMessage = 'Impossible d\'analyser le document automatiquement.';

      if (error instanceof Error) {
        if (error.message.includes('connecté')) {
          errorMessage = 'Vous devez être connecté pour analyser un document.';
        } else if (error.message.includes('permissions')) {
          errorMessage = 'Permissions insuffisantes. Veuillez vous reconnecter.';
        } else if (error.message.includes('non disponible')) {
          errorMessage = 'Service d\'analyse temporairement indisponible.';
        }
      }

      Alert.alert(
        'Erreur d\'analyse',
        `${errorMessage}\n\nLa vérification manuelle sera effectuée à la place.`,
        [{ text: 'Continuer' }]
      );
    } finally {
      setAnalyzing(false);
    }
  };
  const handleBiometricComparison = async (documentUri: string, selfieUri: string) => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    setComparingFaces(true);

    try {
      console.log('=== Début comparaison biométrique ===');
      console.log('Document URI local:', documentUri);
      console.log('Selfie URI local:', selfieUri);

      const userId = auth.currentUser.uid;
      const timestamp = Date.now();

      // Upload des deux images vers Firebase Storage
      console.log('Upload des images vers Firebase Storage...');

      const documentURL = await uploadImage(
        documentUri,
        `temp/${userId}/biometric_doc_${timestamp}.jpg`
      );

      const selfieURL = await uploadImage(
        selfieUri,
        `temp/${userId}/biometric_selfie_${timestamp}.jpg`
      );

      console.log('Images uploadées:', { documentURL, selfieURL });

      // Appeler la fonction de comparaison avec les URLs Firebase Storage
      const result = await compareFaces(documentURL, selfieURL, userId);
      console.log('Résultat comparaison biométrique:', result);
      setBiometricResult(result);

      if (result.success) {
        if (result.match && result.confidence > 0.7) {
          Alert.alert(
            'Comparaison biométrique réussie ✅',
            `Excellente correspondance détectée !\n\nSimilarité: ${Math.round(result.similarityScore * 100)}%\nConfiance: ${Math.round(result.confidence * 100)}%\n\nVotre identité peut être vérifiée automatiquement.`,
            [{ text: 'Parfait !', onPress: () => console.log('Biométrie réussie') }]
          );
        } else if (result.match) {
          Alert.alert(
            'Correspondance détectée ⚠️',
            `Correspondance moyenne détectée.\n\nSimilarité: ${Math.round(result.similarityScore * 100)}%\nConfiance: ${Math.round(result.confidence * 100)}%\n\nUne vérification manuelle sera effectuée.`,
            [{ text: 'Continuer' }]
          );
        } else {
          Alert.alert(
            'Pas de correspondance ❌',
            `Les visages ne correspondent pas suffisamment.\n\nSimilarité: ${Math.round(result.similarityScore * 100)}%\n\nVeuillez reprendre le selfie ou la vérification sera manuelle.`,
            [
              { text: 'Reprendre le selfie', onPress: () => setSelfie(null) },
              { text: 'Continuer quand même', style: 'cancel' }
            ]
          );
        }
      } else {
        Alert.alert(
          'Erreur de comparaison ❌',
          result.error || 'Impossible de comparer les visages.\n\nLa vérification manuelle sera effectuée.',
          [{ text: 'Continuer' }]
        );
      }

      // Nettoyer les fichiers temporaires
      try {
        console.log('Nettoyage des fichiers temporaires...');
        await Promise.allSettled([
          fetch(documentURL, { method: 'DELETE' }).catch(() => { }),
          fetch(selfieURL, { method: 'DELETE' }).catch(() => { })
        ]);
      } catch (cleanupError) {
        console.warn('Erreur lors du nettoyage:', cleanupError);
      }

    } catch (error) {
      console.error('Erreur comparaison biométrique:', error);
      Alert.alert(
        'Erreur de comparaison',
        'Impossible de comparer les visages automatiquement.\n\nLa vérification manuelle sera effectuée.',
        [{ text: 'Continuer' }]
      );
    } finally {
      setComparingFaces(false);
    }
  };

  const handleSubmit = async () => {
    if (!idFront || !auth.currentUser) {
      Alert.alert('Erreur', 'Veuillez au minimum prendre une photo de votre pièce d\'identité');
      return;
    }

    setLoading(true);

    try {
      const userId = auth.currentUser.uid;
      const timestamp = Date.now();      // Upload des images finales
      const idFrontURL = await uploadImage(
        idFront,
        `verifications/${userId}/id_front_${timestamp}.jpg`
      );

      // Upload du selfie seulement s'il est fourni
      let selfieURL = null;
      if (selfie) {
        selfieURL = await uploadImage(
          selfie,
          `verifications/${userId}/selfie_${timestamp}.jpg`
        );
      }      // Déterminer le statut basé sur l'analyse et la biométrie
      let isAutoApproved = false;

      // Vérification automatique si :
      // 1. Analyse du document réussie avec bonne confiance
      // 2. ET comparaison biométrique réussie (si selfie fourni)
      if (analysisResult?.success && analysisResult.confidence > 0.8) {
        if (selfie && biometricResult) {
          // Si selfie fourni, vérifier la biométrie
          isAutoApproved = biometricResult.success && biometricResult.match && biometricResult.confidence > 0.7;
        } else {
          // Pas de selfie, approval basé uniquement sur l'analyse du document
          isAutoApproved = true;
        }
      } const verificationStatus = isAutoApproved ? 'auto_approved' : 'pending';

      // Préparer les informations du profil extraites du document
      const extractedUserInfo: {
        firstName?: string;
        lastName?: string;
        birthDate?: string;
        documentNumber?: string;
        mrzData?: any;
      } = {};

      if (analysisResult?.success && analysisResult.data) {
        if (analysisResult.data.firstName?.value) {
          extractedUserInfo.firstName = String(analysisResult.data.firstName.value);
        }
        if (analysisResult.data.lastName?.value) {
          extractedUserInfo.lastName = String(analysisResult.data.lastName.value);
        }
        if (analysisResult.data.birthDate?.value) {
          extractedUserInfo.birthDate = String(analysisResult.data.birthDate.value);
        }
        if (analysisResult.data.documentNumber?.value) {
          extractedUserInfo.documentNumber = String(analysisResult.data.documentNumber.value);
        }
        // Ajouter les informations MRZ si disponibles
        if ((analysisResult as any).mrzData) {
          extractedUserInfo.mrzData = (analysisResult as any).mrzData;
        }
      }

      // Mise à jour complète du profil utilisateur
      const updateData: any = {
        verification_status: verificationStatus,
        verification_documents: {
          id_front: idFrontURL,
          selfie: selfieURL, // Peut être null
          submitted_at: serverTimestamp(),
          analysis_result: analysisResult || null,
          biometric_result: biometricResult || null,
          auto_approved: isAutoApproved,
        }
      };

      // Si vérification automatique approuvée, mettre à jour le profil avec les informations extraites
      if (isAutoApproved && Object.keys(extractedUserInfo).length > 0) {
        updateData.profile = {
          ...extractedUserInfo,
          verified: true,
          verification_date: serverTimestamp(),
          verification_method: 'automatic'
        };

        console.log('Mise à jour du profil avec les informations extraites:', extractedUserInfo);
      }

      await updateDoc(doc(db, 'users', userId), updateData);

      // Si vérification automatique approuvée et selfie fourni, programmer sa suppression
      if (isAutoApproved && selfieURL) {
        // Programmer la suppression du selfie après 7 jours pour conformité RGPD
        setTimeout(async () => {
          try {
            console.log('Suppression programmée du selfie après vérification réussie (RGPD)');
            const storage = getStorage();
            const selfieRef = ref(storage, selfieURL);
            await deleteObject(selfieRef);

            // Mettre à jour la base de données pour supprimer la référence
            await updateDoc(doc(db, 'users', userId), {
              'verification_documents.selfie': null,
              'verification_documents.selfie_deleted_at': serverTimestamp(),
              'verification_documents.selfie_deletion_reason': 'auto_cleanup_post_verification'
            });

            console.log('Selfie supprimé automatiquement après vérification');
          } catch (cleanupError) {
            console.warn('Erreur lors de la suppression automatique du selfie:', cleanupError);
          }
        }, 7 * 24 * 60 * 60 * 1000); // 7 jours
      } const message = isAutoApproved
        ? 'Félicitations ! Votre identité a été vérifiée automatiquement grâce à notre système d\'analyse avancé. Votre compte est maintenant vérifié.'
        : 'Votre demande de vérification a été envoyée avec succès. Nos équipes vont examiner votre document et vous informer du résultat sous 24-48h.'; const title = isAutoApproved ? 'Vérification approuvée ✅' : 'Demande envoyée 📋';      // Nettoyer les images temporaires et selfies après traitement
      try {
        console.log('Nettoyage des images temporaires...');

        // Nettoyer tous les fichiers temporaires de l'utilisateur
        await cleanupAllUserTempFiles(userId);

        console.log('Images temporaires nettoyées avec succès');
      } catch (cleanupError) {
        console.warn('Erreur lors du nettoyage des images temporaires:', cleanupError);
        // Ne pas faire échouer le processus à cause du nettoyage
      }

      // Message personnalisé avec les informations extraites si disponibles
      let personalizedMessage = message;
      if (isAutoApproved && Object.keys(extractedUserInfo).length > 0) {
        const extractedInfo = [];
        if (extractedUserInfo.firstName) extractedInfo.push(`Prénom: ${extractedUserInfo.firstName}`);
        if (extractedUserInfo.lastName) extractedInfo.push(`Nom: ${extractedUserInfo.lastName}`);
        if (extractedUserInfo.birthDate) extractedInfo.push(`Naissance: ${extractedUserInfo.birthDate}`);

        if (extractedInfo.length > 0) {
          personalizedMessage += `\n\nInformations détectées:\n${extractedInfo.join('\n')}`;
        }
      }

      // Si vérification automatique approuvée et selfie fourni, le supprimer après 7 jours
      if (isAutoApproved && selfie) {
        setTimeout(() => {
          cleanupSelfieAfterVerification(userId);
        }, 7 * 24 * 60 * 60 * 1000); // 7 jours
      }

      Alert.alert(
        title,
        personalizedMessage,
        [{ text: 'Parfait !', onPress: () => router.replace('/(tabs)/Profile') }]
      );

    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      Alert.alert(
        'Erreur d\'envoi',
        'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };
  const renderAnalysisResult = () => {
    if (!analysisResult || !analysisResult.success || !analysisResult.data) return null;

    const confidence = Math.round((analysisResult.confidence || 0) * 100);
    const confidenceColor = confidence > 80 ? '#0f0' : confidence > 60 ? '#ff0' : '#f80';

    return (
      <View style={styles.analysisResult}>
        <Text style={styles.analysisTitle}>✨ Informations détectées automatiquement:</Text>        {analysisResult.data.firstName && analysisResult.data.firstName.value && (
          <Text style={styles.analysisText}>
            👤 Prénom: {String(analysisResult.data.firstName.value)}
            <Text style={styles.confidenceText}> ({Math.round((analysisResult.data.firstName.confidence || 0) * 100)}%)</Text>
          </Text>
        )}

        {analysisResult.data.lastName && analysisResult.data.lastName.value && (
          <Text style={styles.analysisText}>
            👤 Nom: {String(analysisResult.data.lastName.value)}
            <Text style={styles.confidenceText}> ({Math.round((analysisResult.data.lastName.confidence || 0) * 100)}%)</Text>
          </Text>
        )}

        {analysisResult.data.birthDate && analysisResult.data.birthDate.value && (
          <Text style={styles.analysisText}>
            📅 Date de naissance: {String(analysisResult.data.birthDate.value)}
            <Text style={styles.confidenceText}> ({Math.round((analysisResult.data.birthDate.confidence || 0) * 100)}%)</Text>
          </Text>
        )}

        {analysisResult.data.documentNumber && analysisResult.data.documentNumber.value && (
          <Text style={styles.analysisText}>
            🔢 N° document: {String(analysisResult.data.documentNumber.value)}
            <Text style={styles.confidenceText}> ({Math.round((analysisResult.data.documentNumber.confidence || 0) * 100)}%)</Text>
          </Text>
        )}        <Text style={[styles.analysisText, { color: confidenceColor, fontWeight: 'bold', marginTop: 8 }]}>
          🎯 Confiance globale: {String(confidence || 0)}%
        </Text>        {confidence > 80 && (
          <Text style={styles.successText}>
            ✅ Excellente qualité ! Vérification automatique possible.
          </Text>
        )}        {analysisResult.mrzValidation && (
          <View style={styles.mrzStatus}>
            <Text style={styles.mrzTitle}>
              🔍 Validation MRZ: {analysisResult.mrzValidation.isValid ? '✅ Valide' : '❌ Invalide'}
            </Text>
            <Text style={styles.mrzConfidence}>
              Confiance MRZ: {Math.round((analysisResult.mrzValidation.confidence || 0) * 100)}%
            </Text>
          </View>
        )}      </View>
    );
  };
  const renderBiometricResult = () => {
    if (!biometricResult || !biometricResult.success) return null;

    const similarityScore = Math.round(biometricResult.similarityScore * 100);
    const confidence = Math.round(biometricResult.confidence * 100);
    const statusColor = biometricResult.match && confidence > 70 ? '#0f0' : confidence > 50 ? '#ffa500' : '#ff4444';

    // Nouvelles informations de débogage
    const matchDecision = biometricResult.details?.matchDecision || 'unknown';
    const qualityScore = biometricResult.details?.qualityScore ? Math.round(biometricResult.details.qualityScore * 100) : 0;

    return (
      <View style={styles.biometricResult}>
        <Text style={styles.biometricTitle}>
          👤 Comparaison biométrique: {biometricResult.match ? '✅ Correspondance' : '❌ Pas de correspondance'}
        </Text>

        <Text style={styles.biometricText}>
          🎯 Similarité des visages: {similarityScore}%
        </Text>

        <Text style={[styles.biometricText, { color: statusColor, fontWeight: 'bold', marginTop: 8 }]}>
          🔒 Confiance biométrique: {confidence}%
        </Text>

        <Text style={styles.biometricText}>
          📊 Qualité des images: {qualityScore}%
        </Text>

        <Text style={styles.biometricText}>
          🤖 Décision algorithmique: {matchDecision === 'match' ? '✅ Match confirmé' :
            matchDecision === 'possible_match' ? '⚠️ Match possible' :
              matchDecision === 'no_match' ? '❌ Pas de match' : '❓ Incertain'}
        </Text>

        {biometricResult.details?.thresholds && (
          <Text style={[styles.biometricText, { fontSize: 12, color: '#666', marginTop: 4 }]}>
            Seuils: ≥{Math.round(biometricResult.details.thresholds.high * 100)}% (confirmé),
            ≥{Math.round(biometricResult.details.thresholds.low * 100)}% (possible)
          </Text>
        )}

        {biometricResult.match && confidence > 70 && (
          <Text style={styles.successText}>
            ✅ Excellente correspondance ! Vérification automatique activée.
          </Text>
        )}

        {(!biometricResult.match || confidence <= 70) && (
          <Text style={styles.warningText}>
            ⚠️ Correspondance faible. Vérification manuelle requise.
          </Text>
        )}
      </View>
    );
  };
  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        <View style={[
          styles.stepDot,
          step >= 1 ? styles.activeStep : styles.inactiveStep
        ]} />
        <View style={styles.stepLine} />
        <View style={[
          styles.stepDot,
          step >= 2 ? styles.activeStep : styles.inactiveStep
        ]} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f0" />        <Text style={styles.loadingText}>
          Envoi en cours ({(progress || 0).toFixed(0)}%)
        </Text>
        <Text style={styles.loadingSubText}>
          Téléchargement de vos documents...
        </Text>
      </View>
    );
  }
  if (analyzing || comparingFaces) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f0" />
        <Text style={styles.loadingText}>
          {analyzing ? '🔍 Analyse en cours...' : '👤 Comparaison biométrique...'}
        </Text>
        <Text style={styles.loadingSubText}>
          {analyzing
            ? 'Extraction des informations de votre document'
            : 'Comparaison de votre visage avec le document'
          }
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        title: "Vérification d'identité",
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
      }} />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Vérification d'identité</Text>        <Text style={styles.subtitle}>
              Étape {String(step || 1)}/2 - Vérification automatique activée
            </Text>

            {renderStepIndicator()}          {step === 1 && (
              <>            <Text style={styles.instruction}>
                📷 Prenez en photo le <Text style={styles.highlight}>recto</Text> de votre pièce d'identité
              </Text>
                <Text style={styles.hint}>
                  L'analyse automatique démarrera après la capture pour vérifier l'authenticité du document
                </Text>

                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => pickImage(setIdFront)}
                >
                  {idFront ? (
                    <Image source={{ uri: idFront }} style={styles.preview} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <FontAwesome name="id-card" size={32} color="#0f0" />
                      <Text style={styles.placeholderText}>Recto de la carte</Text>
                    </View>
                  )}
                </TouchableOpacity>            {renderAnalysisResult()}

                {/* Affichage de la validation MRZ si disponible */}
                {analysisResult?.mrzValidation && (
                  <MRZValidationDisplay
                    mrzValidation={analysisResult.mrzValidation}
                    crossValidation={analysisResult.crossValidation}
                  />
                )}            {/* Bouton pour continuer - toujours visible après avoir pris une photo */}
                {idFront && (
                  <TouchableOpacity
                    style={[styles.nextButton, { marginTop: 20 }]}
                    onPress={() => setStep(2)}
                  >
                    <Text style={styles.buttonText}>Continuer vers le selfie →</Text>
                  </TouchableOpacity>
                )}            {/* Bouton pour analyser manuellement si pas d'analyse automatique */}
                {idFront && !analysisResult && !analyzing && (
                  <TouchableOpacity
                    style={[styles.analyzeButton, { marginTop: 12 }]}
                    onPress={() => handleAnalyzeDocument(idFront)}
                  >
                    <Text style={styles.buttonText}>🔍 Analyser le document</Text>
                  </TouchableOpacity>
                )}
              </>
            )}          {step === 2 && (
              <>
                <Text style={styles.instruction}>
                  🤳 Prenez un <Text style={styles.highlight}>selfie</Text> avec votre visage clairement visible
                </Text>
                <Text style={styles.hint}>
                  Cette photo permettra de vérifier la correspondance avec votre pièce d'identité (optionnel)
                </Text>                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => pickImage(setSelfie, true)}
                >
                  {selfie ? (
                    <Image source={{ uri: selfie }} style={styles.preview} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <FontAwesome name="camera" size={32} color="#0f0" />
                      <Text style={styles.placeholderText}>Selfie</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Affichage du résultat biométrique si disponible */}
                {renderBiometricResult()}

                {analysisResult && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>📋 Résumé de votre demande</Text>
                    <Text style={styles.summaryText}>
                      {analysisResult.success && analysisResult.confidence > 0.8
                        ? '✅ Document analysé avec succès - Vérification automatique possible'
                        : analysisResult.success
                          ? '⚠️ Document analysé mais qualité moyenne - Vérification manuelle requise'
                          : '❌ Document non analysable - Vérification manuelle requise'
                      }
                    </Text>                {analysisResult.mrzValidation && (
                      <Text style={[styles.summaryText, { marginTop: 8 }]}>
                        🔍 MRZ: {analysisResult.mrzValidation.isValid ? '✅ Valide' : '❌ Invalide'}
                        ({Math.round((analysisResult.mrzValidation.confidence || 0) * 100)}%)
                      </Text>
                    )}
                  </View>
                )}<View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setStep(1)}
                  >
                    <Text style={styles.backButtonText}>← Retour</Text>
                  </TouchableOpacity>

                  {selfie ? (
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleSubmit}
                    >
                      <Text style={styles.buttonText}>🚀 Terminer</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.skipButton}
                      onPress={handleSubmit}
                    >
                      <Text style={styles.skipButtonText}>⏭️ Passer cette étape</Text>
                    </TouchableOpacity>
                  )}
                </View>          </>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>✕ Annuler</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  scrollView: {
    flex: 1,
  }, scrollContent: {
    paddingBottom: 100, // Plus d'espace pour que les boutons soient visibles
  },
  card: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeStep: {
    backgroundColor: '#0f0',
  },
  inactiveStep: {
    backgroundColor: '#333',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  hint: {
    color: '#888',
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  highlight: {
    color: '#0f0',
    fontWeight: 'bold',
  },
  imageButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#222',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  }, nextButton: {
    backgroundColor: '#0f0',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  analyzeButton: {
    backgroundColor: '#007acc',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  }, submitButton: {
    backgroundColor: '#0f0',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  skipButton: {
    backgroundColor: '#ff8800',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 12,
  },
  cancelButtonText: {
    color: '#ff4444',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  loadingSubText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  // Styles pour l'analyse
  analysisResult: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0f0',
  },
  analysisTitle: {
    color: '#0f0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  analysisText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  confidenceText: {
    color: '#888',
    fontSize: 12,
  }, successText: {
    color: '#0f0',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  warningText: {
    color: '#ffa500',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },

  // Styles pour la biométrie
  biometricResult: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4169e1',
  },
  biometricTitle: {
    color: '#4169e1',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  biometricText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },

  mrzStatus: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007acc',
  },
  mrzTitle: {
    color: '#007acc',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mrzConfidence: {
    color: '#ccc',
    fontSize: 12,
  },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    color: '#0f0',
    fontSize: 14,
    fontWeight: '500',
  },
});
