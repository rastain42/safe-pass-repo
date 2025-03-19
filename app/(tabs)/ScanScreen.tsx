import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Alert, Dimensions } from "react-native";
import { CameraView, Camera } from "expo-camera";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { TicketStatus } from '@/types/enum';
import CustomModal from "@/components/design/CustomModal";

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

export default function ScanScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: '',
        message: '',
        type: 'success' as 'success' | 'error' | 'warning'
    });


    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        };

        getCameraPermissions();
    }, []);


    const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        try {
            const ticketData = JSON.parse(data);

            if (!ticketData || !ticketData.ticketId) {
                setModalContent({
                    title: 'Erreur',
                    message: 'QR code invalide ou mal formaté',
                    type: 'error'
                });
                setModalVisible(true);
                return;
            }

            const ticketRef = doc(db, 'user_tickets', ticketData.ticketId);

            try {
                const ticketSnap = await getDoc(ticketRef);

                if (!ticketSnap.exists()) {
                    setModalContent({
                        title: 'Erreur',
                        message: 'Billet introuvable',
                        type: 'error'
                    });
                    setModalVisible(true);
                    return;
                }

                const userTicket = ticketSnap.data();

                if (userTicket.status === TicketStatus.Used) {
                    setModalContent({
                        title: 'Refusé',
                        message: 'Ce billet a déjà été scanné',
                        type: 'warning'
                    });
                    setModalVisible(true);
                    return;
                }

                await updateDoc(ticketRef, {
                    status: TicketStatus.Used,
                    scannedAt: new Date().toISOString()
                });

                setModalContent({
                    title: 'Succès',
                    message: 'Billet validé avec succès',
                    type: 'success'
                });
                setModalVisible(true);

            } catch (firestoreError: any) {
                console.error('Erreur Firestore:', firestoreError);

                // Gérer spécifiquement l'erreur d'autorisation
                if (firestoreError.code === 'permission-denied') {
                    setModalContent({
                        title: 'Accès refusé',
                        message: 'Vous n\'avez pas les droits pour scanner ce billet. Vous devez être un organisateur.',
                        type: 'error'
                    });
                } else {
                    setModalContent({
                        title: 'Erreur',
                        message: 'Une erreur est survenue lors de la validation du billet',
                        type: 'error'
                    });
                }
                setModalVisible(true);
            }

        } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            setModalContent({
                title: 'Erreur',
                message: 'Format de QR code invalide',
                type: 'error'
            });
            setModalVisible(true);
        }
    };

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Demande d'accès à la caméra...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Accès à la caméra refusé</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={StyleSheet.absoluteFillObject}
            >
                <View style={styles.overlay}>
                    <View style={styles.unfilled} />
                    <View style={styles.row}>
                        <View style={styles.unfilled} />
                        <View style={styles.scanArea}>
                            <Text style={styles.scanText}>
                                Placez le QR code du billet dans le cadre
                            </Text>
                        </View>
                        <View style={styles.unfilled} />
                    </View>
                    <View style={styles.unfilled} />
                </View>
            </CameraView>

            {scanned && (
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setScanned(false)}
                >
                    <Text style={styles.buttonText}>Scanner un autre billet</Text>
                </TouchableOpacity>
            )}
            <CustomModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setScanned(false);
                }}
                title={modalContent.title}
                message={modalContent.message}
                type={modalContent.type}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000'
    },
    text: {
        color: '#fff',
        margin: 20,
        textAlign: 'center'
    },
    button: {
        backgroundColor: '#0f0',
        padding: 15,
        borderRadius: 8,
        alignSelf: 'center',
        marginBottom: 40,
        minWidth: 180,
        position: 'absolute',
        bottom: 0
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    overlay: {
        flex: 1
    },
    unfilled: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)'
    },
    row: {
        flexDirection: 'row',
        height: SCAN_AREA_SIZE
    },
    scanArea: {
        width: SCAN_AREA_SIZE,
        height: SCAN_AREA_SIZE,
        borderWidth: 2,
        borderColor: '#0f0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    scanText: {
        color: '#fff',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: 5,
        fontSize: 14
    }
});