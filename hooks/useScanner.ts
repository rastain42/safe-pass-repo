import { useState } from "react";
import * as ticketService from "@/services/ticket.service";

type ScanResultType = "success" | "error" | "warning";

interface ScanResult {
  title: string;
  message: string;
  type: ScanResultType;
}

export function useScanner() {
  const [scanned, setScanned] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<ScanResult>({
    title: "",
    message: "",
    type: "success",
  });

  const handleBarcodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);

    // Parser le QR code
    const parseResult = ticketService.parseTicketQrCode(data);

    if (!parseResult.success) {
      setModalContent(parseResult as ScanResult);
      setModalVisible(true);
      return;
    }

    // Valider le ticket
    const validationResult = await ticketService.validateTicket(
      parseResult.ticketId
    );
    setModalContent(validationResult as ScanResult);
    setModalVisible(true);
  };

  const resetScanner = () => {
    setScanned(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetScanner();
  };

  return {
    scanned,
    modalVisible,
    modalContent,
    handleBarcodeScanned,
    resetScanner,
    closeModal,
  };
}
