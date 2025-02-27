import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Text } from '@/components/Themed';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { TicketStatus } from '@/types/enum';

export default function ScanScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        try {
            setScanned(true);
            const ticketData = JSON.parse(data);

            const ticketDoc = await getDoc(doc(db, 'user_tickets', ticketData.ticketId));

            if (!ticketDoc.exists()) {
                Alert.alert('Erreur', 'Ticket introuvable');
                return;
            }

            const ticketInfo = ticketDoc.data();

            if (ticketInfo.status !== TicketStatus.Valid) {
                Alert.alert('Erreur', 'Ticket déjà utilisé ou invalide');
                return;
            }

            // Update ticket status
            await updateDoc(doc(db, 'user_tickets', ticketData.ticketId), {
                status: TicketStatus.Used
            });

            Alert.alert('Succès', 'Ticket validé avec succès');

        } catch (error) {
            console.error('Scan error:', error);
            Alert.alert('Erreur', 'QR Code invalide');
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
                <Text style={styles.text}>Pas d'accès à la caméra</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
            />
            {scanned && (
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setScanned(false)}
                >
                    <Text style={styles.buttonText}>Scanner à nouveau</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#0f0',
        padding: 15,
        borderRadius: 8,
        position: 'absolute',
        bottom: 50,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});