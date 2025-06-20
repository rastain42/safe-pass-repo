import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useDashboardStats } from '@/hooks/events/useDashboardStats';
import { formatPrice } from '@/utils/format';

export default function DashboardScreen() {
  const { stats, loading, error, refreshStats } = useDashboardStats();

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#0f0' />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name='exclamation-triangle' size={48} color='#ff4444' />
        <Text style={styles.errorText}>Erreur lors du chargement</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshStats}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshStats} tintColor='#0f0' />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de bord</Text>
        <Text style={styles.subtitle}>Statistiques de vos événements</Text>
      </View>

      {/* Statistiques générales */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <FontAwesome name='calendar' size={24} color='#0f0' />
            <Text style={styles.statNumber}>{stats?.totalEvents || 0}</Text>
            <Text style={styles.statLabel}>Événements créés</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome name='ticket' size={24} color='#ff9800' />
            <Text style={styles.statNumber}>{stats?.totalTicketsSold || 0}</Text>
            <Text style={styles.statLabel}>Billets vendus</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome name='users' size={24} color='#2196f3' />
            <Text style={styles.statNumber}>{stats?.totalParticipants || 0}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome name='euro' size={24} color='#4caf50' />
            <Text style={styles.statNumber}>{formatPrice(stats?.totalRevenue || 0)}</Text>
            <Text style={styles.statLabel}>Revenus totaux</Text>
          </View>
        </View>
      </View>

      {/* Événements récents */}
      <View style={styles.recentEventsContainer}>
        <Text style={styles.sectionTitle}>Événements récents</Text>
        {stats?.recentEvents && stats.recentEvents.length > 0 ? (
          stats.recentEvents.map((event: any) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventDate}>
                  {new Date(event.start_date).toLocaleDateString('fr-FR')}
                </Text>
              </View>

              <View style={styles.eventStats}>
                <View style={styles.eventStat}>
                  <FontAwesome name='ticket' size={16} color='#ff9800' />
                  <Text style={styles.eventStatText}>{event.ticketsSold || 0} billets vendus</Text>
                </View>

                <View style={styles.eventStat}>
                  <FontAwesome name='euro' size={16} color='#4caf50' />
                  <Text style={styles.eventStatText}>{formatPrice(event.revenue || 0)}</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>
                  Capacité: {event.ticketsSold || 0}/{event.capacity}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          ((event.ticketsSold || 0) / event.capacity) * 100,
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noEventsContainer}>
            <FontAwesome name='calendar-o' size={48} color='#666' />
            <Text style={styles.noEventsText}>Aucun événement récent</Text>
          </View>
        )}
      </View>

      {/* Statistiques de performance */}
      <View style={styles.performanceContainer}>
        <Text style={styles.sectionTitle}>Performance</Text>

        <View style={styles.performanceCard}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Taux de remplissage moyen</Text>
            <Text style={styles.performanceValue}>
              {stats?.averageFillRate ? `${Math.round(stats.averageFillRate)}%` : '0%'}
            </Text>
          </View>

          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Prix moyen par billet</Text>
            <Text style={styles.performanceValue}>
              {formatPrice(stats?.averageTicketPrice || 0)}
            </Text>
          </View>

          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Événements à venir</Text>
            <Text style={styles.performanceValue}>{stats?.upcomingEvents || 0}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '47%',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  recentEventsContainer: {
    padding: 20,
  },
  eventCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  eventDate: {
    fontSize: 14,
    color: '#888',
  },
  eventStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventStatText: {
    fontSize: 14,
    color: '#fff',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0f0',
    borderRadius: 3,
  },
  noEventsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noEventsText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  performanceContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  performanceCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#fff',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f0',
  },
});
