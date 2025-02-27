import EventCard from '@/components/Design/EventCard';
import { View, FlatList, StyleSheet, Image } from 'react-native';
import { Event } from '../../types/event';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { router } from 'expo-router';
import { AgeRestriction } from '@/types/enum';
export default function EventListScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const querySnapshot = await getDocs(eventsRef);

        const fetchedEvents = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            location: data.location,
            start_date: data.start_date.toDate(),
            end_date: data.end_date.toDate(),
            capacity: data.capacity,
            age_restriction: data.age_restriction,
            organizerId: data.organizerId,
            image: data.image
          } as Event;
        });

        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Erreur lors de la récupération des événements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const eventsmock: Event[] = [
    {
      id: '1',
      name: "Soirée Electro",
      description: "Une soirée électro inoubliable avec les meilleurs DJs",
      location: "Club XYZ, Paris",
      start_date: new Date("2024-03-15T20:00:00"),
      end_date: new Date("2024-03-16T04:00:00"),
      capacity: 500,
      age_restriction: AgeRestriction.None,
      organizerId: 0,
      tickets: []
    },
    {
      id: '2',
      name: "Soirée Electro",
      description: "Une soirée électro inoubliable avec les meilleurs DJs",
      location: "Club XYZ, Paris",
      start_date: new Date("2024-03-15T20:00:00"),
      end_date: new Date("2024-03-16T04:00:00"),
      capacity: 500,
      age_restriction: AgeRestriction.Eighteen,
      image: "../../assets/images/safepasslogoV1.png",
      organizerId: 0,
      tickets: []
    },
    // Ajoutez d'autres événements ici
  ];

  const handleEventPress = (eventId: string) => {
    router.push({
      pathname: "/EventDetails",
      params: { id: eventId }
    });
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