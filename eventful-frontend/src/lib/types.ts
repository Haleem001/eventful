export type Role = "CREATOR" | "EVENTEE";

export type EventCategory =
  | "CONCERT"
  | "SPORTS"
  | "THEATER"
  | "FESTIVAL"
  | "WORKSHOP"
  | "CONFERENCE"
  | "OTHER";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface EventCreator {
  id: string;
  name?: string;
  email: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  price: string;
  capacity: number;
  ticketsSold: number;
  category: EventCategory;
  creatorId: string;
  creator?: EventCreator;
  reminderConfig?: string[];
  createdAt: string;
}

export interface PaginatedEventsResponse {
  data: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Ticket {
  id: string;
  reference: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  isScanned: boolean;
  qrCode: string | null;
  qrToken: string | null;
  eventeeId: string;
  eventId: string;
  event?: Event;
  createdAt: string;
}

export interface EventBreakdown {
  eventId: string;
  title: string;
  capacity: number;
  ticketsSold: number;
  scanned: number;
  revenue: number;
}

export interface CreatorAnalytics {
  totalRevenue: number;
  totalTicketsSold: number;
  totalScanned: number;
  events: EventBreakdown[];
}

export interface InitializePaymentResponse {
  authorizationUrl: string;
  reference: string;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  venue: string;
  date: string;
  price: number;
  capacity: number;
  category?: EventCategory;
  reminderConfig?: string[];
}

export interface TicketWithAttendee extends Ticket {
  eventee: User;
}

export interface VerifyTicketResponse {
  id: string;
  reference: string;
  status: string;
  isScanned: boolean;
  eventeeId: string;
  eventId: string;
  event?: Event;
}

export interface Reminder {
  id: string;
  eventId: string;
  eventeeId: string;
  remindAt: string;
  sent: boolean;
  event?: Event;
}
