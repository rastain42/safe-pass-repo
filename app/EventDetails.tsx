import React, { useState, useEffect, useRef } from 'react';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '@/firebase/config';
import PaymentScreen from '../components/PaymentScreen';
import { Event } from '@/types/event';
import { UserTicket } from '@/types/tickets';
import { TicketStatus } from '@/types/enum';

export default function EventDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const [event, setEvent] = useState<Event | null>(null);
    const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [showPayment, setShowPayment] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                const eventDoc = await getDoc(doc(db, 'events', id as string));

                if (eventDoc.exists()) {
                    const data = eventDoc.data();

                    setEvent({
                        ...data,
                        id: eventDoc.id,
                        start_date: data.start_date?.toDate() || new Date(),
                        end_date: data.end_date?.toDate() || new Date(),
                    } as Event);
                } else {
                    console.log('Event not found');
                }
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    const updateTicketQuantity = (ticketId: string, increment: boolean) => {
        setSelectedTickets(prev => {
            const currentQty = prev[ticketId] || 0;
            const newQty = increment ? currentQty + 1 : Math.max(0, currentQty - 1);
            const updatedTickets = { ...prev, [ticketId]: newQty };

            // Si on ajoute un ticket et que cela fera apparaître le bouton de paiement
            // Alors on scrolle vers le bas
            const hadTickets = Object.values(prev).some(qty => qty > 0);
            const hasTickets = Object.values(updatedTickets).some(qty => qty > 0);

            // Si on vient juste d'ajouter le premier ticket ou on a ajouté un ticket supplémentaire
            if (increment && ((!hadTickets && hasTickets) || hasTickets)) {
                // Utiliser setTimeout pour s'assurer que le rendu est fait avant de scroller
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 300);
            }

            return updatedTickets;
        });
    };

    // Fonction pour gérer le paiement Stripe
    const handlePurchase = () => {
        if (!event || !auth.currentUser) {
            Alert.alert('Erreur', 'Veuillez vous connecter pour effectuer un achat.');
            return;
        }

        // Vérifier qu'au moins un billet est sélectionné
        const hasTickets = Object.values(selectedTickets).some(qty => qty > 0);
        if (!hasTickets) {
            Alert.alert('Erreur', 'Veuillez sélectionner au moins un billet');
            return;
        }

        // Afficher l'écran de paiement
        setShowPayment(true);
    };

    // Fonction pour créer les tickets après le paiement réussi
    const handlePaymentSuccess = async (paymentIntentId: string) => {
        setProcessingPayment(true);
        try {
            if (!event || !auth.currentUser) return;

            const userTicketsRef = collection(db, 'user_tickets');
            let purchasedTickets = [];
            let firstEventName = "";
            let firstTicketName = "";
            let totalPrice = 0;

            // Créer un ticket pour chaque billet sélectionné
            for (const ticket of event.tickets) {
                const quantity = selectedTickets[ticket.id] || 0;

                if (quantity > 0) {
                    // Garder les infos du premier ticket pour le modal de confirmation
                    if (firstEventName === "") {
                        firstEventName = event.name;
                        firstTicketName = ticket.name;
                    }

                    totalPrice += ticket.price * quantity;

                    for (let i = 0; i < quantity; i++) {
                        const ticketId = doc(userTicketsRef).id;

                        const userTicket: UserTicket = {
                            id: ticketId,
                            user_id: auth.currentUser.uid,
                            event_id: event.id,
                            purchase_date: new Date(),
                            price: ticket.price,
                            qr_code: JSON.stringify({
                                ticketId,
                                eventId: event.id,
                                userId: auth.currentUser.uid,
                                timestamp: Date.now()
                            }),
                            status: TicketStatus.Valid,
                            created_at: new Date(),
                            payment_intent_id: paymentIntentId
                        };

                        await setDoc(doc(userTicketsRef, userTicket.id), userTicket);
                        purchasedTickets.push(ticketId);
                    }
                }
            }

            // Réinitialiser les sélections après l'achat
            setSelectedTickets({});
            setShowPayment(false);
            setProcessingPayment(false);

            // Déterminer le message en fonction du nombre de tickets achetés
            const ticketCount = purchasedTickets.length;
            const additionalMessage = ticketCount > 1
                ? `et ${ticketCount - 1} autres billets`
                : '';

            // Naviguer vers le modal de confirmation
            router.push({
                pathname: '/purchaseConfirmationScreen',
                params: {
                    eventName: firstEventName,
                    ticketName: `${firstTicketName} ${additionalMessage}`,
                    price: totalPrice.toString(),
                    ticketCount: ticketCount.toString(),
                }
            });

        } catch (error) {
            console.error('Error creating tickets:', error);
            Alert.alert('Erreur', "Le paiement a été accepté mais une erreur est survenue lors de la création des billets. Notre équipe a été notifiée.");
        } finally {
            setProcessingPayment(false);
        }
    };

    // Fonction pour gérer l'annulation du paiement
    const handlePaymentCancel = () => {
        setShowPayment(false);
    };

    // Pour le mode démo/debug (à supprimer en production)
    const handleLegacyPurchase = async (shouldSucceed: boolean) => {
        try {
            if (!event || !auth.currentUser) return;

            if (!shouldSucceed) {
                throw new Error("Simulation d'échec d'achat");
            }

            const userTicketsRef = collection(db, 'user_tickets');
            let purchasedTickets = [];
            let firstEventName = "";
            let firstTicketName = "";
            let totalPrice = 0;

            // Créer un ticket pour chaque billet sélectionné
            for (const ticket of event.tickets) {
                const quantity = selectedTickets[ticket.id] || 0;

                if (quantity > 0) {
                    // Garder les infos du premier ticket pour le modal de confirmation
                    if (firstEventName === "") {
                        firstEventName = event.name;
                        firstTicketName = ticket.name;
                    }

                    totalPrice += ticket.price * quantity;

                    for (let i = 0; i < quantity; i++) {
                        const ticketId = doc(userTicketsRef).id;

                        const userTicket: UserTicket = {
                            id: ticketId,
                            user_id: auth.currentUser.uid,
                            event_id: event.id,
                            purchase_date: new Date(),
                            price: ticket.price,
                            qr_code: JSON.stringify({
                                ticketId,
                                eventId: event.id,
                                userId: auth.currentUser.uid,
                                timestamp: Date.now()
                            }),
                            status: TicketStatus.Valid,
                            created_at: new Date(),
                        };
                        await setDoc(doc(userTicketsRef, userTicket.id), userTicket);
                        purchasedTickets.push(ticketId);
                    }
                }
            }

            // Déterminer le message en fonction du nombre de tickets achetés
            const ticketCount = purchasedTickets.length;
            const additionalMessage = ticketCount > 1
                ? `et ${ticketCount - 1} autres billets`
                : '';

            // Naviguer vers le modal de confirmation
            router.push({
                pathname: '/purchaseConfirmationScreen',
                params: {
                    eventName: firstEventName,
                    ticketName: `${firstTicketName} ${additionalMessage}`,
                    price: totalPrice.toString(),
                    ticketCount: ticketCount.toString(),
                }
            });

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

    const totalAmount = event.tickets.reduce((sum, ticket) =>
        sum + (selectedTickets[ticket.id] || 0) * ticket.price, 0
    );

    const ticketsData = event.tickets
        .filter(ticket => (selectedTickets[ticket.id] || 0) > 0)
        .map(ticket => ({
            id: ticket.id,
            name: ticket.name,
            price: ticket.price,
            quantity: selectedTickets[ticket.id] || 0
        }));

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
                    source={event.image ? { uri: event.image } : require('../assets/images/safepasslogoV1.png')}
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
                            {format(event.start_date, 'dd MMM yyyy - HH:mm', { locale: fr })}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <FontAwesome name="users" size={16} color="#0f0" />
                        <Text style={styles.infoText}>{event.capacity} places</Text>
                    </View>

                    <View style={styles.descriptionContainer}>
                        <Text style={styles.description}>{event.description}</Text>
                    </View>

                    <View style={styles.ticketsContainer}>
                        <Text style={styles.sectionTitle}>Billets disponibles</Text>
                        {event.tickets.map(ticket => (
                            <View key={ticket.id} style={styles.ticketRow}>
                                <View style={styles.ticketInfo}>
                                    <Text style={styles.ticketName}>{ticket.name}</Text>
                                    <Text style={styles.ticketPrice}>{ticket.price}€</Text>
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
                            <Text style={styles.totalText}>Total: {totalAmount}€</Text>
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