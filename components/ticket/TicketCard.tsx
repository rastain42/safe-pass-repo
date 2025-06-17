import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FontAwesome } from "@expo/vector-icons";
import { useEventDetails } from "@/hooks/useEventDetails";
import { UserTicket } from "@/types/tickets";

interface TicketCardProps {
  ticket: UserTicket;
  onPress?: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onPress }) => {
  const { eventName, eventStartDate, loading } = useEventDetails(ticket.event_id);

  const formatEventDate = () => {
    if (!eventStartDate) return "Date non disponible";
    try {
      return "le " + format(eventStartDate, "dd MMM yyyy à HH:mm", { locale: fr });
    } catch (error) {
      console.error("Erreur de formatage de date :", error);
      return "Date invalide";
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.header}>
        <Text style={styles.eventName}>{eventName}</Text>
        <View
          style={[
            styles.statusBadge,
            ticket.status === "valid" ? styles.validBadge : styles.usedBadge,
          ]}
        >
          <Text style={styles.statusText}>
            {ticket.status === "valid" ? "Valide" : "Utilisé"}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.date}>
          {eventStartDate ? `${formatEventDate()}` : "Date de l'événement non disponible"}
        </Text>
        <Text style={styles.price}>{ticket.price} €</Text>
      </View>

      <View style={styles.footer}>
        <FontAwesome name="qrcode" size={14} color="#0f0" />
        <Text style={styles.footerText}>Afficher le QR code</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#0f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  eventName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  validBadge: {
    backgroundColor: "rgba(0, 255, 0, 0.2)",
  },
  usedBadge: {
    backgroundColor: "rgba(255, 0, 0, 0.2)",
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  content: {
    marginBottom: 12,
  },
  date: {
    color: "#888",
    fontSize: 14,
    marginBottom: 8,
  },
  price: {
    color: "#0f0",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    color: "#0f0",
    marginLeft: 8,
    fontSize: 14,
  },
});

export default TicketCard;