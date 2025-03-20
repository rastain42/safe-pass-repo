import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Text, Modal } from 'react-native';
import TicketCard from '@/components/ticket/TicketCard';
import { useLocalSearchParams } from 'expo-router';
import TicketDetail from '@/components/ticket/TicketDetail';
import { useTickets } from '@/hooks/useTickets';

export default function TicketsListScreen() {
  const { refresh } = useLocalSearchParams();

  const {
    tickets,
    loading,
    refreshing,
    error,
    selectedTicket,
    showTicketModal,
    handleRefresh,
    handleTicketPress,
    setShowTicketModal
  } = useTickets(refresh as string);

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