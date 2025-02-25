import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useForm, Controller } from 'react-hook-form';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

interface EventForm {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
}

export default function EventFormScreen() {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<EventForm>({
    defaultValues: {
      title: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  const startDate = watch('startDate');

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
      console.log('Image picking error:', error);
    }
  };

  const onSubmit = (data: EventForm) => {
    console.log('Form data:', data);
    console.log('Cropped image:', imageUri);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Créer un Événement</Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Titre</Text>
        <Controller
          control={control}
          rules={{
            required: 'Le titre est requis',
            minLength: {
              value: 3,
              message: 'Le titre doit contenir au moins 3 caractères'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              onChangeText={onChange}
              value={value}
              placeholder="Titre de l'événement"
              placeholderTextColor="#888"
            />
          )}
          name="title"
        />
        {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

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
          name="startDate"
        />

        <Text style={styles.label}>Date et heure de fin</Text>
        <Controller
          control={control}
          rules={{
            required: 'La date de fin est requise',
            validate: (value) =>
              value > startDate || 'La date de fin doit être après la date de début'
          }}
          render={({ field: { onChange, value } }) => (
            <>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.dateButtonText}>{format(value, 'dd/MM/yyyy HH:mm')}</Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showEndPicker}
                mode="datetime"
                minimumDate={startDate}
                onConfirm={(date: Date) => {
                  setShowEndPicker(false);
                  onChange(date);
                }}
                onCancel={() => setShowEndPicker(false)}
                date={value}
              />
            </>
          )}
          name="endDate"
        />
        {errors.endDate && <Text style={styles.errorText}>{errors.endDate.message}</Text>}

        <TouchableOpacity onPress={openImagePicker} style={[styles.button, { marginBottom: 12 }]}>
          <Text style={styles.buttonText}>Choisir une image</Text>
        </TouchableOpacity>

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: 200, marginBottom: 16 }}
            resizeMode="cover"
          />
        )}

        <TouchableOpacity
          style={[
            styles.button,
            errors.title || errors.description ? styles.buttonDisabled : null
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={!!errors.title || !!errors.description}
        >
          <Text style={styles.buttonText}>Créer l'événement</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});
