import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { UserTicket } from '@/types/tickets';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { db } from '@/firebase/config';
import { getDoc, doc } from 'firebase/firestore';
import { Event } from '@/types/event';
import QRCode from 'react-native-qrcode-svg';
import { Modal } from 'react-native';

interface TicketCardProps {
  ticket: UserTicket;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [eventName, setEventName] = useState<string>('Chargement...');
  const [showQR, setShowQR] = useState(false);

  const qrData = JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.event_id,
    userId: ticket.user_id,
    qrCode: ticket.qr_code,
    timestamp: Date.now()
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', ticket.event_id));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data() as Event;
          setEventName(eventData.name);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        setEventName('Événement non trouvé');
      }
    };

    fetchEventDetails();
  }, [ticket.event_id]);


  return (
    <>

      <TouchableOpacity
        style={styles.ticketAccordion}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.headerTitle}>{eventName}</Text>
          <View style={styles.icon}>
            <FontAwesome
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color="#0f0"
            />
          </View>
        </View>

        {isOpen && (
          <View style={styles.ticketContent}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date d'achat:</Text>
              <Text style={styles.value}>
                {format(ticket.purchase_date, 'dd MMMM yyyy', { locale: fr })}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Prix:</Text>
              <Text style={styles.value}>{ticket.price}€</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Statut:</Text>
              <Text style={[styles.value, { color: ticket.status === 'valid' ? '#0f0' : '#ff4444' }]}>
                {ticket.status}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => setShowQR(true)}
            >
              <Text style={styles.qrButtonText}>Voir QR Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showQR}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQR(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{eventName}</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={qrData}
                size={200}
                color="black"
                backgroundColor="white"
              />
            </View>
            <Text style={styles.modalText}>Scannez ce code à l'entrée</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQR(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
  },
  modalText: {
    color: '#aaa',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  ticketAccordion: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#0f0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  icon: {
    backgroundColor: '#222',
    padding: 5,
    borderRadius: 8,
  },
  ticketContent: {
    marginTop: 10,
    backgroundColor: '#1a1f1d',
    padding: 15,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    color: '#fff',
    fontSize: 14,
  },
  qrButton: {
    backgroundColor: '#0f0',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TicketCard;