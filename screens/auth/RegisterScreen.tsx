import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Button } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

export default function RegisterScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Titre du formulaire */}
      <Text style={styles.title}>Forms</Text>

      {/* Conteneur du formulaire */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Form title</Text>
        <Text style={styles.formDescription}>
          Lorem ipsum dolor sit amet. Qui nobis nostrum ut voluptas incidunt.
        </Text>

        {/* Champ 1 */}
        <Text style={styles.label}>Label</Text>
        <TextInput style={styles.input} placeholder="Placeholder.." placeholderTextColor="#888" />
        <Text style={styles.inputTip}>Input tip</Text>

        {/* Champ 2 */}
        <Text style={styles.label}>Label</Text>
        <TextInput style={styles.input} placeholder="Placeholder.." placeholderTextColor="#888" />
        <Text style={styles.inputTip}>Input tip</Text>

        {/* Champ avec icône */}
        <Text style={styles.label}>Label</Text>
        <View style={styles.iconBox}>
          <FontAwesome5 name="comment-dots" size={32} color="white" />
          <Text style={styles.iconText}>Talk to us!</Text>
        </View>
        <Text style={styles.inputTip}>Input tip</Text>

        {/* Bouton */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')} >
          <Text style={styles.buttonText}>retour</Text>
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
});
