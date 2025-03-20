import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Text, View } from '@/components/basic/Themed';
import { useForm, Controller } from 'react-hook-form';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { getAuth } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import { AgeRestriction } from '@/types/enum';
import { EventTicket } from '@/types/tickets';
import { router } from 'expo-router';
import CustomModal from '@/components/design/CustomModal';

interface EventForm {
  name: string;
  description: string;
  location: string;
  start_date: Date;
  end_date: Date;
  capacity: number;
  age_restriction: AgeRestriction;
  image?: string;
  tickets: EventTicket[];
}

export default function EventFormScreen() {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<EventTicket>({
    id: '',
    name: '',
    price: null as unknown as number,
    quantity: null as unknown as number,
    description: '',
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleAddTicket = () => {
    if (!currentTicket.price || !currentTicket.quantity) {
      return; // Ou afficher une erreur
    }

    setTickets([...tickets, {
      ...currentTicket,
      id: Date.now().toString(),
      price: currentTicket.price || 0,
      quantity: currentTicket.quantity || 0,
    }]);

    setCurrentTicket({
      id: '',
      name: '',
      price: null as unknown as number,
      quantity: null as unknown as number,
      description: '',
    });
    setShowTicketForm(false);
  };



  const handleRemoveTicket = (ticketId: string) => {
    setTickets(tickets.filter(t => t.id !== ticketId));
  };


  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<EventForm>({
    defaultValues: {
      name: '',
      description: '',
      location: '',
      start_date: new Date(),
      end_date: new Date(),
      capacity: 0,
      age_restriction: AgeRestriction.None,
    },
  });

  const start_date = watch('start_date');

  const openImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) return;

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 5],
        quality: 1,
      });

      if (!picked.canceled) {
        const cropped = await ImageManipulator.manipulateAsync(
          picked.assets[0].uri,
          [{ crop: { originX: 0, originY: 0, width: 300, height: 300 } }],
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );
        setImageUri(cropped.uri);
      }
    } catch (error) {
    }
  };

  const onSubmit = async (data: EventForm) => {
    try {
      setIsSubmitting(true);
      setSubmissionError(null);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setSubmissionError('Utilisateur non connecté');
        return;
      }

      const eventsRef = collection(db, 'events');
      const newEventRef = doc(eventsRef); // Génère un nouvel ID automatiquement

      const formData = {
        ...data,
        id: newEventRef.id,
        creatorId: user.uid,
        image: imageUri,
        tickets: tickets,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await setDoc(newEventRef, formData);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      setSubmissionError('Une erreur est survenue lors de la création de l\'événement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    reset();
    setImageUri(null);
    setTickets([]);

    router.push('/(tabs)/Index');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Créer un Événement</Text>
      <CustomModal
        visible={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title="Événement créé !"
        message="Votre événement a été créé avec succès et est maintenant visible pour les participants."
        type="success"
      />
      <View style={styles.formContainer}>
        <Text style={styles.label}>Nom</Text>
        <Controller
          control={control}
          rules={{
            required: 'Le nom est requis',
            minLength: {
              value: 3,
              message: 'Le nom doit contenir au moins 3 caractères'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              onChangeText={onChange}
              value={value}
              placeholder="Nom de l'événement"
              placeholderTextColor="#888"
            />
          )}
          name="name"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

        <Text style={styles.label}>Description</Text>
        <Controller
          control={control}
          rules={{
            required: 'La description est requise',
            minLength: {
              value: 10,
              message: 'La description doit contenir au moins 10 caractères'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              onChangeText={onChange}
              value={value}
              placeholder="Description de l'événement"
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
            />
          )}
          name="description"
        />
        {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

        <Text style={styles.label}>Lieu</Text>
        <Controller
          control={control}
          rules={{
            required: 'Le lieu est requis',
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              onChangeText={onChange}
              value={value}
              placeholder="Lieu de l'événement"
              placeholderTextColor="#888"
            />
          )}
          name="location"
        />
        {errors.location && <Text style={styles.errorText}>{errors.location.message}</Text>}

        <Text style={styles.label}>Capacité</Text>
        <Controller
          control={control}
          rules={{
            required: 'La capacité est requise',
            min: {
              value: 1,
              message: 'La capacité doit être supérieure à 0'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              onChangeText={(text) => onChange(parseInt(text) || 0)}
              value={value.toString()}
              placeholder="Nombre de places"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
          )}
          name="capacity"
        />
        {errors.capacity && <Text style={styles.errorText}>{errors.capacity.message}</Text>}


        <Text style={styles.label}>Restriction d'âge</Text>
        <Controller
          control={control}
          rules={{
            required: "La restriction d'âge est requise",
          }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerContainer}>
              <Picker
                style={styles.picker}
                selectedValue={value}
                onValueChange={onChange}
                dropdownIconColor="#000"
                mode="dropdown"
              >
                {Object.values(AgeRestriction).map((restriction) => (
                  <Picker.Item
                    key={restriction}
                    label={restriction}
                    value={restriction}
                    color="#000"
                  />
                ))}
              </Picker>
            </View>
          )}
          name="age_restriction"
        />
        {errors.age_restriction && <Text style={styles.errorText}>{errors.age_restriction.message}</Text>}

        <Text style={styles.label}>Date et heure de début</Text>
        <Controller
          control={control}
          rules={{ required: 'La date de début est requise' }}
          render={({ field: { onChange, value } }) => (
            <>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.dateButtonText}>{format(value, 'dd/MM/yyyy HH:mm')}</Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showStartPicker}
                mode="datetime"
                onConfirm={(date: Date) => {
                  setShowStartPicker(false);
                  onChange(date);
                }}
                onCancel={() => setShowStartPicker(false)}
                date={value}
              />
            </>
          )}
          name="start_date"
        />

        <Text style={styles.label}>Date et heure de fin</Text>
        <Controller
          control={control}
          rules={{
            required: 'La date de fin est requise',
            validate: (value) =>
              value > start_date || 'La date de fin doit être après la date de début'
          }}
          render={({ field: { onChange, value } }) => (
            <>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.dateButtonText}>{format(value, 'dd/MM/yyyy HH:mm')}</Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showEndPicker}
                mode="datetime"
                minimumDate={start_date}
                onConfirm={(date: Date) => {
                  setShowEndPicker(false);
                  onChange(date);
                }}
                onCancel={() => setShowEndPicker(false)}
                date={value}
              />
            </>
          )}
          name="end_date"
        />
        {errors.end_date && <Text style={styles.errorText}>{errors.end_date.message}</Text>}

        <TouchableOpacity onPress={openImagePicker} style={[styles.button, { marginBottom: 12 }]}>
          <Text style={styles.buttonText}>Choisir une image</Text>
        </TouchableOpacity>

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: 400, marginBottom: 16 }}
            resizeMode='contain'
          />
        )}

        <View style={styles.ticketsSection}>
          <Text style={styles.sectionTitle}>Tickets</Text>

          {tickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketName}>{ticket.name}</Text>
                <Text style={styles.ticketDetails}>
                  Prix: {ticket.price}€ - Quantité: {ticket.quantity}
                </Text>
                {ticket.description && (
                  <Text style={styles.ticketDescription}>{ticket.description}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveTicket(ticket.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          {showTicketForm ? (
            <View style={styles.ticketForm}>
              <TextInput
                style={styles.input}
                placeholder="Nom du ticket"
                placeholderTextColor="#888"
                value={currentTicket.name}
                onChangeText={(text) => setCurrentTicket({ ...currentTicket, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Prix"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={currentTicket.price ? currentTicket.price.toString() : ''}
                onChangeText={(text) => setCurrentTicket({
                  ...currentTicket,
                  price: text ? parseFloat(text) : null as unknown as number
                })}
              />
              <TextInput
                style={styles.input}
                placeholder="Quantité disponible"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={currentTicket.quantity ? currentTicket.quantity.toString() : ''}
                onChangeText={(text) => setCurrentTicket({
                  ...currentTicket,
                  quantity: text ? parseInt(text) : null as unknown as number
                })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optionnel)"
                placeholderTextColor="#888"
                multiline
                value={currentTicket.description}
                onChangeText={(text) => setCurrentTicket({ ...currentTicket, description: text })}
              />
              <View style={styles.ticketFormButtons}>
                <TouchableOpacity
                  style={[styles.button, { flex: 1, backgroundColor: '#666' }]}
                  onPress={() => setShowTicketForm(false)}
                >
                  <Text style={styles.buttonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { flex: 1 }]}
                  onPress={handleAddTicket}
                >
                  <Text style={styles.buttonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, { marginVertical: 12 }]}
              onPress={() => setShowTicketForm(true)}
            >
              <Text style={styles.buttonText}>Ajouter un ticket</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, Object.keys(errors).length > 0 ? styles.buttonDisabled : null]}
          onPress={handleSubmit(onSubmit)}
          disabled={Object.keys(errors).length > 0}
        >
          <Text style={styles.buttonText}>Créer l'événement</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ticketsSection: {
    backgroundColor: 'transparent',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketInfo: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  ticketName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ticketDetails: {
    color: '#0f0',
    fontSize: 14,
    marginTop: 4,
  },
  ticketDescription: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  ticketForm: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  ticketFormButtons: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  formContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#111',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#fff',
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButtonText: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 16,
  },
  pickerContainer: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    backgroundColor: '#222',
    height: 50,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
});