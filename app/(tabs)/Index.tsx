import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import EventCard from '@/components/event/EventCard';
import RefreshableList from '@/components/design/RefreshableList';
import { useEvents } from '@/hooks/useEvents';
import { navigateToEventDetails } from '@/utils/navigation';

export default function EventListScreen() {
  const { events, loading, refreshing, handleRefresh } = useEvents();

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
            onPress={() => navigateToEventDetails(item.id)}
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