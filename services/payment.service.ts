import { getFunctions, httpsCallable } from "firebase/functions";

export const createPaymentIntent = async (
  amount: number,
  eventId: string,
  tickets: any[]
) => {
  const functions = getFunctions();
  const createPaymentIntentFn = httpsCallable(functions, "createPaymentIntent");

  const result = await createPaymentIntentFn({
    amount,
    eventId,
    tickets: tickets.map((t) => ({
      ticketId: t.id,
      name: t.name,
      price: t.price,
      quantity: t.quantity,
    })),
  });

  const { clientSecret, paymentIntentId } = result.data as {
    clientSecret: string;
    paymentIntentId: string;
  };

  if (!clientSecret) {
    throw new Error("Réponse invalide du serveur : clientSecret manquant");
  }

  return { clientSecret, paymentIntentId };
};
