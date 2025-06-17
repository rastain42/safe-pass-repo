import React from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Modal,
    ActivityIndicator
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, Stack } from 'expo-router';
import { auth } from '@/firebase/config';
import PaymentScreen from '../../components/payment/PaymentScreen';
import { useEventDetails } from '@/hooks/useEventDetails';
import { useTicketPurchase } from '@/hooks/useTicketPurchase';
import { formatEventDateTime, formatPrice } from '@/utils/format';
import { EventTicket } from '@/types/tickets';

export default function EventDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { event, loading } = useEventDetails(id as string);

    const {
        selectedTickets,
        showPayment,
        processingPayment,
        totalAmount,
        ticketsData,
        scrollViewRef,
        updateTicketQuantity,
        handlePurchase,
        handlePaymentSuccess,
        handlePaymentCancel,
        setProcessingPayment
    } = useTicketPurchase(event);

    // Pour le mode démo/debug (à supprimer en production)
    const handleLegacyPurchase = async (shouldSucceed: boolean) => {
        try {
            if (!event || !auth.currentUser) return;

            if (!shouldSucceed) {
                throw new Error("Simulation d'échec d'achat");
            }

            // Simuler un achat réussi avec le hook existant
            await handlePaymentSuccess('test_payment_intent_id');
        } catch (error) {
            console.error('Purchase error:', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de l'achat");
        }
    };

    if (loading || !event) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <>
            {/* Supprimer l'en-tête "Event details" */}
            <Stack.Screen options={{
                headerShown: false
            }} />

            <ScrollView
                style={styles.container}
                ref={scrollViewRef}
            >
                <Image
                    source={event.image ? { uri: event.image } : require('../../assets/images/safepasslogoV1.png')}
                    style={styles.image}
                />

                <View style={styles.content}>
                    <Text style={styles.title}>{event.name}</Text>

                    <View style={styles.infoRow}>
                        <FontAwesome name="map-marker" size={16} color="#0f0" />
                        <Text style={styles.infoText}>{event.location}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <FontAwesome name="calendar" size={16} color="#0f0" />
                        <Text style={styles.infoText}>
                            {formatEventDateTime(event.start_date)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <FontAwesome name="users" size={16} color="#0f0" />
                        <Text style={styles.infoText}>{event.capacity} places</Text>
                    </View>

                    <View style={styles.descriptionContainer}>
                        <Text style={styles.description}>{event.description}</Text>
                    </View>                    <View style={styles.ticketsContainer}>
                        <Text style={styles.sectionTitle}>Billets disponibles</Text>
                        {event.tickets.map((ticket: EventTicket) => (
                            <View key={ticket.id} style={styles.ticketRow}>
                                <View style={styles.ticketInfo}>
                                    <Text style={styles.ticketName}>{ticket.name}</Text>
                                    <Text style={styles.ticketPrice}>{formatPrice(ticket.price)}</Text>
                                    {ticket.description && (
                                        <Text style={styles.ticketDescription}>{ticket.description}</Text>
                                    )}
                                </View>
                                <View style={styles.quantitySelector}>
                                    <TouchableOpacity
                                        onPress={() => updateTicketQuantity(ticket.id, false)}
                                        style={styles.quantityButton}
                                    >
                                        <Text style={styles.quantityButtonText}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.quantity}>{selectedTickets[ticket.id] || 0}</Text>
                                    <TouchableOpacity
                                        onPress={() => updateTicketQuantity(ticket.id, true)}
                                        style={styles.quantityButton}
                                    >
                                        <Text style={styles.quantityButtonText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>

                    {totalAmount > 0 && (
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalText}>Total: {formatPrice(totalAmount)}</Text>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.purchaseButton, { backgroundColor: '#0f0' }]}
                                    onPress={handlePurchase}
                                >
                                    <Text style={styles.purchaseButtonText}>
                                        Payer avec Carte
                                    </Text>
                                </TouchableOpacity>

                                {/* Boutons de test - à supprimer en production */}
                                {__DEV__ && (
                                    <TouchableOpacity
                                        style={[styles.purchaseButton, { backgroundColor: '#f00' }]}
                                        onPress={() => handleLegacyPurchase(false)}
                                    >
                                        <Text style={styles.purchaseButtonText}>Test Échec</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Espace supplémentaire en bas pour éviter que le bouton soit collé au bas de l'écran */}
                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>

            {/* Modal de paiement Stripe */}
            <Modal
                visible={showPayment}
                transparent={true}
                animationType="slide"
                onRequestClose={handlePaymentCancel}
            >
                <View style={styles.modalContainer}>
                    {processingPayment ? (
                        <View style={styles.processingContainer}>
                            <ActivityIndicator size="large" color="#0f0" />
                            <Text style={styles.processingText}>Traitement de votre paiement...</Text>
                        </View>
                    ) : (
                        <PaymentScreen
                            eventId={event.id}
                            eventName={event.name}
                            tickets={ticketsData}
                            totalAmount={totalAmount}
                            onCancel={handlePaymentCancel}
                            onSuccess={handlePaymentSuccess}
                        />
                    )}
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#fff',
        textAlign: 'center',
        marginTop: 20,
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    infoText: {
        color: '#aaa',
        fontSize: 16,
    },
    descriptionContainer: {
        marginVertical: 16,
        padding: 16,
        backgroundColor: '#0a0f0d',
        borderRadius: 8,
    },
    description: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 24,
    },
    ticketsContainer: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    ticketRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0a0f0d',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    ticketInfo: {
        flex: 1,
    },
    ticketName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    ticketPrice: {
        color: '#0f0',
        fontSize: 16,
        marginTop: 4,
    },
    ticketDescription: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 4,
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityButton: {
        backgroundColor: '#0f0',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonText: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
    },
    quantity: {
        color: '#fff',
        fontSize: 18,
        minWidth: 30,
        textAlign: 'center',
    },
    totalContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#0a0f0d',
        borderRadius: 8,
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        rowGap: 10,
    },
    totalText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    purchaseButton: {
        backgroundColor: '#0f0',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    purchaseButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 20,
    },
    processingContainer: {
        backgroundColor: '#111',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
        maxWidth: 400,
    },
    processingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    }
});