import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AgeRestriction } from '@/types/enum';

interface EventCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  start_date: Date;
  end_date: Date;
  capacity: number;
  age_restriction: AgeRestriction;
  image?: string | number;
  onPress?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({
  name,
  description,
  location,
  start_date,
  end_date,
  capacity,
  age_restriction,
  image,
  onPress
}) => {
  return (
    < TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={typeof image === 'string'
          ? { uri: image }
          : image || require('../../assets/images/safepasslogoV1.png')}
        style={styles.image}
      />

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{name}</Text>

        <View style={styles.infoRow}>
          <FontAwesome name="map-marker" size={16} color="#0f0" />
          <Text style={styles.infoText} numberOfLines={1}>{location}</Text>
        </View>

        <View style={styles.infoRow}>
          <FontAwesome name="calendar" size={16} color="#0f0" />
          <Text style={styles.infoText}>
            {format(start_date, 'dd MMM yyyy - HH:mm', { locale: fr })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <FontAwesome name="users" size={16} color="#0f0" />
          <Text style={styles.infoText}>{capacity} places</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.ageRestriction}>
            <FontAwesome
              name={age_restriction === AgeRestriction.None ? 'universal-access' : 'warning'}
              size={16}
              color="#0f0"
            />
            <Text style={styles.ageText}>
              {age_restriction === AgeRestriction.None ? 'Tout public' : 'Réservé +18'}
            </Text>
          </View>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Voir plus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0f0d',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#0f0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 4,
  },
  descriptionContainer: {
    marginVertical: 8,
  },
  description: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ageRestriction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageText: {
    color: '#0f0',
    fontSize: 12,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default EventCard;