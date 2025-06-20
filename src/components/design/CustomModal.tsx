import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { getModalBackgroundColor } from '@/utils/ui.utils';

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning';
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  message,
  type = 'success',
}) => {
  const backgroundColor = getModalBackgroundColor(type);

  return (
    <Modal animationType='fade' transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={[styles.header, { backgroundColor }]}>
            <Text style={styles.titleText}>{title}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor }]} onPress={onClose}>
            <Text style={styles.buttonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: Dimensions.get('window').width * 0.8,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
  },
  header: {
    padding: 15,
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  titleText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    padding: 15,
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomModal;
