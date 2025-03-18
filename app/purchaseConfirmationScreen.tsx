import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { tr } from 'date-fns/locale';

export default function PurchaseConfirmationScreen() {
    const { eventName, ticketName, price, ticketCount } = useLocalSearchParams();
    const router = useRouter();

    const handleViewTickets = () => {
        // Naviguer vers la liste des tickets avec le paramètre refresh
        router.navigate({
            pathname: '/(tabs)/TicketList',
            params: { refresh: Date.now().toString() } // Utiliser un timestamp pour forcer le refresh
        });
    };

    const handleClose = () => {
        router.back(); // Retourner à la page précédente
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Achat confirmé',
                presentation: 'modal',
                headerShown: false,
            }} />

            <View style={styles.confirmationCard}>
                <View style={styles.iconContainer}>
                    <FontAwesome name="check-circle" size={80} color="#0f0" />
                </View>

                <Text style={styles.title}>Achat réussi !</Text>

                <View style={styles.detailsContainer}>
                    <Text style={styles.detailsLabel}>Événement :</Text>
                    <Text style={styles.detailsValue}>{eventName}</Text>

                    <Text style={styles.detailsLabel}>Billet{Number(ticketCount) > 1 ? 's' : ''} :</Text>
                    <Text style={styles.detailsValue}>{ticketName}</Text>

                    <Text style={styles.detailsLabel}>Montant total :</Text>
                    <Text style={styles.detailsValue}>{price} €</Text>
                </View>

                <Text style={styles.message}>
                    {Number(ticketCount) > 1
                        ? `Vos ${ticketCount} billets ont été ajoutés à votre compte.`
                        : `Votre billet a été ajouté à votre compte.`}
                    Vous pouvez y accéder à tout moment dans la section "Mes Tickets".
                </Text>

                <TouchableOpacity style={styles.primaryButton} onPress={handleViewTickets}>
                    <FontAwesome name="ticket" size={16} color="#000" style={styles.buttonIcon} />
                    <Text style={styles.primaryButtonText}>Voir mes tickets</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
                    <Text style={styles.secondaryButtonText}>Continuer l'exploration</Text>
                </TouchableOpacity>
            </View>

            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: 16,
    },
    confirmationCard: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#0f0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 24,
        shadowColor: '#0f0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        backgroundColor: 'transparent',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f0',
        marginBottom: 24,
    },
    detailsContainer: {
        width: '100%',
        marginBottom: 24,
        backgroundColor: 'transparent',

    },
    detailsLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    detailsValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16,
    },
    message: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    primaryButton: {
        backgroundColor: '#0f0',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#0f0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 5,
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#0f0',
        fontSize: 14,
    },
    buttonIcon: {
        marginRight: 8,
    }
});