import { useLocalSearchParams } from 'expo-router';
import { navigateToTicketList, goBack } from '@/utils/navigation';
import { pluralize, getTicketCountMessage, formatPrice } from '@/utils/format';

export function usePurchaseConfirmation() {
  const { eventName, ticketName, price, ticketCount } = useLocalSearchParams();

  const ticketCountNum = Number(ticketCount || '1');

  const formattedData = {
    eventName: String(eventName || ''),
    ticketName: String(ticketName || ''),
    formattedPrice: formatPrice(Array.isArray(price) ? price[0] || '0' : price || '0'),
    ticketCountText: pluralize('billet', ticketCountNum),
    confirmationMessage: getTicketCountMessage(ticketCountNum),
  };

  const handleViewTickets = () => {
    navigateToTicketList();
  };

  const handleClose = () => {
    goBack();
  };

  return {
    ...formattedData,
    handleViewTickets,
    handleClose,
  };
}
