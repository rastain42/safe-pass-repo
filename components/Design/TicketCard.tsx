import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface Ticket {
  id: number;
  event_name: string;
  purchase_date: string;
  price: number;
  status: string;
  qr_code: string;
}

const TicketCard = ({ ticket }: { ticket: Ticket }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TouchableOpacity 
      style={styles.ticketAccordion} 
      onPress={() => setIsOpen(!isOpen)}
      activeOpacity={0.7}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.headerTitle}>{ticket.event_name}</Text>
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
            <Text style={styles.value}>{ticket.purchase_date}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Prix:</Text>
            <Text style={styles.value}>{ticket.price}€</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Statut:</Text>
            <Text style={styles.value}>{ticket.status}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.qrButton}
            onPress={() => alert(`QR Code: ${ticket.qr_code}`)}
          >
            <Text style={styles.qrButtonText}>Voir QR Code</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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