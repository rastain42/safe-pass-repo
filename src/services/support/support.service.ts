// Service de support (placeholder)
export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: Date;
}

export const createSupportTicket = async (
  userId: string,
  subject: string,
  message: string
): Promise<string> => {
  // Placeholder - à implémenter
  return `ticket_${Date.now()}`;
};

export const submitContactRequest = async (
  name: string,
  email: string,
  message: string
): Promise<void> => {
  // Placeholder - à implémenter avec Firebase ou service email
  console.log('Contact request submitted:', { name, email, message });
};

export const submitPhoneChangeRequest = async (
  userId: string,
  newPhone: string,
  reason: string
): Promise<void> => {
  // Placeholder - à implémenter avec validation et processus d'approbation
  console.log('Phone change request submitted:', { userId, newPhone, reason });
};
