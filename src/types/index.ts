// Export des types partagés
export * from './shared';

// Export des types d'événements
export * from './events';

// Export des types de tickets
export * from './tickets';

// Export des types utilisateurs (nouvelle structure)
export * from './user';

// Types legacy pour compatibilité (à supprimer progressivement)
export interface LegacyUser {
  id: string;
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  role: string;
  verified_status: string;
  created_at: any;
  updated_at: any;
}
