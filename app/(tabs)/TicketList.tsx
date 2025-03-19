import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Text, Modal } from 'react-native';
import TicketCard from '@/components/ticket/TicketCard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { getAuth } from 'firebase/auth';
import { UserTicket } from '@/types/tickets';
import { useLocalSearchParams } from 'expo-router';
import TicketDetail from '@/components/ticket/TicketDetail';

export default function TicketsListScreen() {
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const { refresh } = useLocalSearchParams();

  const fetchTickets = useCallback(async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("Utilisateur non connecté");
        return;
      }

      const ticketsRef = collection(db, 'user_tickets');
      const q = query(ticketsRef, where('user_id', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const userTickets: UserTicket[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userTickets.push({
          ...data,
          id: doc.id,
          purchase_date: data.purchase_date?.toDate() || new Date(),
          created_at: data.created_at?.toDate() || new Date(),
        } as UserTicket);
      });

      setTickets(userTickets);
      setError(null);
    } catch (err: any) {
      setError(`Erreur: ${err.code} - ${err.message}`);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  const handleTicketPress = (ticket: UserTicket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  // Rafraîchir la liste quand le paramètre refresh change
  useEffect(() => {
    if (refresh) {
      handleRefresh();
    }
  }, [refresh, handleRefresh]);

  useEffect(() => {
    const initialFetch = async () => {
      await fetchTickets();
      setLoading(false);
    };
    initialFetch();
  }, [fetchTickets]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0f0" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (tickets.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.listContainer, styles.centered, { flex: 1 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0f0"
              colors={["#0f0"]}
              title="Actualisation..."
              titleColor="#fff"
            />
          }
        >
          <Text style={styles.emptyText}>Aucun ticket trouvé</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        renderItem={({ item }) => (
          <TicketCard
            ticket={item}
            onPress={() => handleTicketPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0f0"
            colors={["#0f0"]}
            title="Actualisation..."
            titleColor="#fff"
          />
        }
      />

      {/* Modal pour afficher les détails du ticket avec le QR code */}
      <Modal
        visible={showTicketModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTicketModal(false)}
      >
        {selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            onClose={() => setShowTicketModal(false)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContainer: {
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  }
});