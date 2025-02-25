import TicketCard from '@/components/Design/TicketCard';
import { View, FlatList, StyleSheet } from 'react-native';

interface Ticket {
  id: number;
  event_name: string;
  purchase_date: string;
  price: number;
  status: string;
  qr_code: string;
}

export default function TicketsListScreen() {
  // Exemple de données (à remplacer par vos données réelles)
  const tickets: Ticket[] = [
    {
      id: 1,
      event_name: "Soirée Electro",
      purchase_date: "24/02/2024",
      price: 25,
      status: "Valide",
      qr_code: "TICKET123"
    },
    {
      id: 2,
      event_name: "Concert Rock",
      purchase_date: "23/02/2024",
      price: 35,
      status: "Utilisé",
      qr_code: "TICKET456"
    }
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TicketCard ticket={item} />
        )}
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
  }
});