import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import TicketCard from '@/components/Design/TicketCard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { getAuth } from 'firebase/auth';
import { UserTicket } from '@/types/tickets';
import { Text } from '@/components/Themed';
import RefreshableList from '@/components/Design/RefreshableList';

export default function TicketsListScreen() {
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Aucun ticket trouvé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RefreshableList
        data={tickets}
        renderItem={({ item }) => <TicketCard ticket={item} />}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
        contentContainerStyle={styles.listContainer}
      />
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
  }
});