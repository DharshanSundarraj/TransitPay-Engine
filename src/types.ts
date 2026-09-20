export type Role = 'ROLE_PASSENGER' | 'ROLE_STAFF';

export interface User {
  id: string;
  name: string;
  cardId: string;
  role: Role;
}

export interface Ticket {
  id: string;
  cardId: string;
  timestamp: number;
  route: string;
  busNumber: string;
  amount: number;
}

export interface Transaction {
  id: string;
  cardId: string;
  type: 'DEPOSIT' | 'TICKET_PURCHASE';
  amount: number;
  timestamp: number;
}

export interface AuthResponse {
  token: string;
  role: Role;
  name: string;
  cardId: string;
}

export interface PassengerProfile {
  name: string;
  cardId: string;
  walletBalance: number;
  tickets: Ticket[];
  transactions: Transaction[];
}
