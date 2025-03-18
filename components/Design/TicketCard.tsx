import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { UserTicket } from '@/types/tickets';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';

interface TicketCardProps {
  ticket: UserTicket;
  onPress?: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onPress }) => {
  const [eventName, setEventName] = useState<string>('Chargement...');
  const [eventStartDate, setEventStartDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', ticket.event_id));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          setEventName(eventData.name || 'Événement sans nom');

          // Récupération de la date de début
          if (eventData.start_date) {
            // Si c'est un timestamp Firestore
            if (eventData.start_date.toDate) {
              setEventStartDate(eventData.start_date.toDate());
            }
            // Si c'est une chaîne ISO
            else if (typeof eventData.start_date === 'string') {
              setEventStartDate(parseISO(eventData.start_date));
            }
            // Si c'est déjà un objet Date
            else if (eventData.start_date instanceof Date) {
              setEventStartDate(eventData.start_date);
            }
            // Si c'est un timestamp en millisecondes
            else if (typeof eventData.start_date === 'number') {
              setEventStartDate(new Date(eventData.start_date));
            }
          }
        } else {
          setEventName('Événement introuvable');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'événement:', error);
        setEventName('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [ticket.event_id]);

  // Fonction pour formater la date avec gestion d'erreur
  const formatEventDate = () => {
    if (!eventStartDate) return 'Date non disponible';
    try {
      return "le " + format(eventStartDate, 'dd MMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date invalide';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.header}>
        <Text style={styles.eventName}>{eventName}</Text>
        <View style={[
          styles.statusBadge,
          ticket.status === 'valid' ? styles.validBadge : styles.usedBadge
        ]}>
          <Text style={styles.statusText}>
            {ticket.status === 'valid' ? 'Valide' : 'Utilisé'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.date}>
          {eventStartDate
            ? `${formatEventDate()}`
            : 'Date de l\'événement non disponible'
          }
        </Text>
        <Text style={styles.price}>{ticket.price} €</Text>
      </View>

      <View style={styles.footer}>
        <FontAwesome name="qrcode" size={14} color="#0f0" />
        <Text style={styles.footerText}>Afficher le QR code</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  validBadge: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
  },
  usedBadge: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  content: {
    marginBottom: 12,
  },
  date: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  price: {
    color: '#0f0',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: '#0f0',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default TicketCard;