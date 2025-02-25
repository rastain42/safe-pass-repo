import EventCard from '@/components/Design/EventCard';
import { View, FlatList, StyleSheet, Image} from 'react-native';

// Type pour un événement
interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  start_date: Date;
  end_date: Date;
  capacity: number;
  age_restriction: string;
  image?: string;
}

export default function EventListScreen() {
  // Exemple de données (à remplacer par vos données réelles)
  const events: Event[] = [
    {
      id: 1,
      name: "Soirée Electro",
      description: "Une soirée électro inoubliable avec les meilleurs DJs",
      location: "Club XYZ, Paris",
      start_date: new Date("2024-03-15T20:00:00"),
      end_date: new Date("2024-03-16T04:00:00"),
      capacity: 500,
      age_restriction: "all_ages",
    },
    {
      id: 2,
      name: "Soirée Electro",
      description: "Une soirée électro inoubliable avec les meilleurs DJs",
      location: "Club XYZ, Paris",
      start_date: new Date("2024-03-15T20:00:00"),
      end_date: new Date("2024-03-16T04:00:00"),
      capacity: 500,
      age_restriction: "verified_only",
      image: "../../assets/images/safepasslogoV1.png"
    },
    // Ajoutez d'autres événements ici
  ];

  const handleEventPress = (eventId: number) => {
    ///router.push(`/event/${eventId}`);
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <Image
        source={require('../../assets/images/safepasslogoV1.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );


  return (
    <View style={styles.container}>
      <FlatList
              ListHeaderComponent={ListHeader}

        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EventCard
            {...item}
            onPress={() => handleEventPress(item.id)}
          />
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
  headerContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  logo: {
    width: 200,
    height: 80,
  },
  listContainer: {
    paddingVertical: 8,
  },
});