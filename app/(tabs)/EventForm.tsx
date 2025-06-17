import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { Text, View } from '@/components/basic/Themed';
import { Controller } from 'react-hook-form';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { Picker } from '@react-native-picker/picker';
import { AgeRestriction } from '@/types/enum';
import CustomModal from '@/components/design/CustomModal';
import { useEventForm } from '@/hooks/useEventForm';

export default function EventFormScreen() {
  const {
    // Form state and handlers
    control,
    errors,
    handleSubmit,
    onSubmit,

    // Image state
    imageUri,
    openImagePicker,

    // Date pickers
    showStartPicker,
    setShowStartPicker,
    showEndPicker,
    setShowEndPicker,
    start_date,

    // Submission state
    showSuccessModal,
    isSubmitting,
    submissionError,
    handleCloseSuccessModal,

    // Ticket management
    tickets,
    showTicketForm,
    currentTicket,
    setShowTicketForm,
    handleAddTicket,
    handleRemoveTicket,
    updateTicketField,
  } = useEventForm();

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

          {tickets.map((ticket: { id: string; name: string; price: number; quantity: number; description?: string }) => (
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
                onChangeText={(text) => updateTicketField('name', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Prix"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={currentTicket.price ? currentTicket.price.toString() : ''}
                onChangeText={(text) => updateTicketField('price', text ? parseFloat(text) : null)}
              />
              <TextInput
                style={styles.input}
                placeholder="Quantité disponible"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={currentTicket.quantity ? currentTicket.quantity.toString() : ''}
                onChangeText={(text) => updateTicketField('quantity', text ? parseInt(text) : null)}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optionnel)"
                placeholderTextColor="#888"
                multiline
                value={currentTicket.description}
                onChangeText={(text) => updateTicketField('description', text)}
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

        {submissionError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{submissionError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (Object.keys(errors).length > 0 || isSubmitting) ? styles.buttonDisabled : null
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={Object.keys(errors).length > 0 || isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Création en cours...' : 'Créer l\'événement'}
          </Text>
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
  }, textArea: {
    height: 100,
    ...(Platform.OS === 'android' && { textAlignVertical: 'top' }),
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