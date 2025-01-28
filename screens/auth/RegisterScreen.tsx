import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("participant");

  const handleRegister = () => {
    // TODO: Implémenter la logique d'inscription
    console.log({ email, password, role });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un Compte</Text>

      <View style={styles.formContainer}>
        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez votre email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Mot de passe */}
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez votre mot de passe"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Sélecteur de rôle */}
        <Text style={styles.label}>Rôle</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={role}
            onValueChange={(itemValue) => setRole(itemValue)}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Participant" value="participant" />
            <Picker.Item label="Organisateur" value="organisateur" />
          </Picker>
        </View>

        {/* Bouton de validation */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Valider</Text>
        </TouchableOpacity>

        {/* Lien retour */}
        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>Déjà un compte ? Connectez-vous</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: "#111",
    padding: 24,
    borderRadius: 10,
    width: "90%",
    maxWidth: 400,
  },
  formTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  formDescription: {
    color: "#aaa",
    marginBottom: 16,
  },
  label: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 4,
  },
  inputTip: {
    color: "#777",
    marginBottom: 12,
  },
  iconBox: {
    height: 100,
    backgroundColor: "#222",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconText: {
    color: "#fff",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#0f0",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#0f0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  pickerContainer: {
    backgroundColor: "#222",
    borderRadius: 8,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden'
  },
  picker: {
    color: "#fff",
    height: 50,
    width: "100%",
  },
  linkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: "#0f0",
    fontSize: 14,
  }
});
