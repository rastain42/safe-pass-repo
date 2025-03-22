import { StyleSheet } from "react-native";

export const verificationStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  card: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 10,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeStep: {
    backgroundColor: "#0f0",
  },
  inactiveStep: {
    backgroundColor: "#333",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#333",
    marginHorizontal: 4,
  },
  instruction: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  imageButton: {
    width: "100%",
    height: 200,
    backgroundColor: "#222",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    resizeMode: "cover",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nextButton: {
    backgroundColor: "#0f0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: "#0f0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ff4444",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
});
