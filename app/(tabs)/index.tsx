import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Event } from '../../types/event';
import EventCard from '@/components/event/EventCard';
import RefreshableList from '@/components/design/RefreshableList';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { router } from 'expo-router';

export default function EventListScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
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
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  useEffect(() => {
    const initialFetch = async () => {
      await fetchEvents();
      setLoading(false);
    };
    initialFetch();
  }, [fetchEvents]);

  const handleEventPress = (eventId: string) => {
    router.push({
      pathname: "/screens/EventDetails",
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0f0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RefreshableList
        ListHeaderComponent={ListHeader}
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EventCard
            {...item}
            onPress={() => handleEventPress(item.id)}
          />
        )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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