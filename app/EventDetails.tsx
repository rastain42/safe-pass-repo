import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { Event } from '@/types/event';
import { UserTicket } from '@/types/tickets';
import { TicketStatus } from '@/types/enum';


export default function EventDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);

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
            return { ...prev, [ticketId]: newQty };
        });
    };

    const handlePurchase = async (shouldSucceed: boolean) => {
        try {
            if (!event || !auth.currentUser) return;

            if (!shouldSucceed) {
                throw new Error("Simulation d'échec d'achat");
            }

            const userTicketsRef = collection(db, 'user_tickets');

            // Créer un ticket pour chaque billet sélectionné
            for (const ticket of event.tickets) {
                const quantity = selectedTickets[ticket.id] || 0;
                for (let i = 0; i < quantity; i++) {
                    const userTicket: UserTicket = {
                        id: doc(userTicketsRef).id,
                        user_id: auth.currentUser.uid,
                        event_id: event.id,
                        purchase_date: new Date(),
                        price: ticket.price,
                        qr_code: `${event.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                        status: TicketStatus.Valid,
                        created_at: new Date(),
                    };

                    await setDoc(doc(userTicketsRef, userTicket.id), userTicket);
                }
            }

            Alert.alert(
                'Succès',
                'Vos billets ont été achetés avec succès !',
                [{ text: 'OK', onPress: () => router.back() }]
            );
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

    return (
        <ScrollView style={styles.container}>
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
                                onPress={() => handlePurchase(true)}
                            >
                                <Text style={styles.purchaseButtonText}>Acheter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.purchaseButton, { backgroundColor: '#f00' }]}
                                onPress={() => handlePurchase(false)}
                            >
                                <Text style={styles.purchaseButtonText}>Simuler échec</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
});