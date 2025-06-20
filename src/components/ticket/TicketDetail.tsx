import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { UserTicket } from '@/types/tickets';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import QRCode from 'react-native-qrcode-svg';

interface TicketDetailProps {
  ticket: UserTicket;
  onClose: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, onClose }) => {
  const [eventName, setEventName] = useState<string>('Chargement...');
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [eventStartDate, setStartEventDate] = useState<Date | null>(null);
  const [eventEndDate, setEndEventDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', ticket.eventId));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          setEventName(eventData.name || 'Événement inconnu');
          setEventImage(eventData.image || null);

          // Récupération et traitement de la date de l'événement
          if (eventData.start_date) {
            // Si c'est un timestamp Firestore
            if (eventData.start_date.toDate) {
              setStartEventDate(eventData.start_date.toDate());
            }
            // Si c'est une chaîne ISO
            else if (typeof eventData.start_date === 'string') {
              setStartEventDate(parseISO(eventData.start_date));
            }
            // Si c'est déjà un objet Date
            else if (eventData.start_date instanceof Date) {
              setStartEventDate(eventData.start_date);
            }
            // Si c'est un nombre (timestamp en millisecondes)
            else if (typeof eventData.start_date === 'number') {
              setStartEventDate(new Date(eventData.start_date));
            }
          }
          // Récupération et traitement de la date de l'événement
          if (eventData.end_date) {
            // Si c'est un timestamp Firestore
            if (eventData.end_date.toDate) {
              setEndEventDate(eventData.end_date.toDate());
            }
            // Si c'est une chaîne ISO
            else if (typeof eventData.end_date === 'string') {
              setEndEventDate(parseISO(eventData.end_date));
            }
            // Si c'est déjà un objet Date
            else if (eventData.end_date instanceof Date) {
              setEndEventDate(eventData.end_date);
            }
            // Si c'est un nombre (timestamp en millisecondes)
            else if (typeof eventData.end_date === 'number') {
              setEndEventDate(new Date(eventData.end_date));
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des détails de l'événement:", error);
      }
    };

    fetchEventDetails();
  }, [ticket.eventId]);

  const qrCodeData = JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.eventId,
    userId: ticket.userId,
    timestamp: Date.now(),
  });

  // Formatage de la date avec gestion d'erreur
  const formatEventDate = (eventDate: any) => {
    if (!eventDate) return 'Date non disponible';
    try {
      return format(eventDate, 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date invalide';
    }
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.ticketDetailCard}>
        {eventImage && (
          <Image source={{ uri: eventImage }} style={styles.eventImage} resizeMode='cover' />
        )}

        <View style={styles.ticketHeader}>
          <View
            style={[
              styles.statusBadge,
              ticket.status === 'valid' ? styles.validBadge : styles.usedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {ticket.status === 'valid' ? 'Valide' : 'Utilisé'}
            </Text>
          </View>

          <Text style={styles.eventTitle}>{eventName}</Text>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name='times' size={24} color='#fff' />
          </TouchableOpacity>
        </View>

        <View style={styles.ticketInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date du début de l'événement</Text>
            <Text style={styles.infoValue}>{formatEventDate(eventStartDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date de fin de l'événement</Text>
            <Text style={styles.infoValue}>{formatEventDate(eventEndDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date d'achat</Text>
            <Text style={styles.infoValue}>
              {format(
                ticket.purchaseDate instanceof Date
                  ? ticket.purchaseDate
                  : new Date(ticket.purchaseDate),
                'dd MMMM yyyy à HH:mm',
                { locale: fr }
              )}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prix</Text>
            <Text style={styles.infoValue}>{ticket.price} €</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Référence</Text>
            <Text style={styles.infoValue}>{ticket.id.substring(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.qrContainer}>
          <QRCode value={qrCodeData} size={200} color='#000' backgroundColor='#fff' />
          <Text style={styles.scanText}>Présentez ce QR code à l'entrée</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  ticketDetailCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 0,
    overflow: 'hidden',
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventImage: {
    width: '100%',
    height: 150,
  },
  ticketHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  eventTitle: {
    marginLeft: 60,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  validBadge: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
  },
  usedBadge: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  ticketInfo: {
    padding: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 2,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
  },
  scanText: {
    marginTop: 16,
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TicketDetail;
