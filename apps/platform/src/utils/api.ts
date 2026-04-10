import ky from "ky";
import Cookies from "js-cookie";

export const api = ky.create({
  prefixUrl: "http://localhost:8000/api",
  hooks: {
    beforeRequest: [
      (request) => {
        if (typeof window !== "undefined") {
          const token = Cookies.get("token");
          if (token) request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
});

export interface ApiTicketType {
  id: string;
  name: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
}

export interface ApiEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  venue: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  isFree: boolean;
  organizerId: string;
  ticketTypes: ApiTicketType[];
  organizer: {
    id: string;
    name: string;
    profileImage: string | null;
    email?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface EventListData {
  events: ApiEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchEvents(
  params: {
    search?: string;
    category?: string;
    isFree?: boolean;
    page?: number;
    limit?: number;
  } = {},
): Promise<EventListData> {
  const searchParams: Record<string, string> = {};
  if (params.search) searchParams.search = params.search;
  if (params.category) searchParams.category = params.category;
  if (params.isFree !== undefined) searchParams.isFree = String(params.isFree);
  if (params.page) searchParams.page = String(params.page);
  if (params.limit) searchParams.limit = String(params.limit);

  const res = await api
    .get("events", { searchParams })
    .json<ApiResponse<EventListData>>();
  return res.data;
}

export async function fetchEventById(id: string): Promise<ApiEvent> {
  const res = await api.get(`events/${id}`).json<ApiResponse<ApiEvent>>();
  return res.data;
}

export async function verifyVoucher(
  eventId: string,
  code: string,
): Promise<{ valid: boolean; code: string; discountAmount: number }> {
  const res = await api.get(`events/${eventId}/vouchers/verify/${code}`).json<
    ApiResponse<{
      valid: boolean;
      code: string;
      discountAmount: number;
      remainingUsage: number;
    }>
  >();
  return res.data;
}

export type TransactionStatus =
  | "WAITING_FOR_PAYMENT"
  | "WAITING_FOR_CONFIRMATION"
  | "DONE"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELED";

export interface ApiTransaction {
  id: string;
  invoiceNumber: string;
  status: TransactionStatus;
  totalPrice: number;
  finalPrice: number;
  pointsUsed: number;
  paymentProof: string | null;
  paymentDeadline: string;
  expiresAt: string;
  createdAt: string;
  event: {
    id: string;
    name: string;
    venue: string;
    location?: string;
    startDate: string;
    endDate?: string;
  };
  items: {
    id?: string;
    quantity: number;
    pricePerUnit: number;
    ticketType: { name: string };
  }[];
  voucher?: { id: string; code: string; discountAmount: number } | null;
  coupon?: { id: string; code: string; discountAmount: number } | null;
}

interface CreateTransactionInput {
  eventId: string;
  items: { ticketTypeId: string; quantity: number }[];
  voucherCode?: string;
  usePoints?: boolean;
}

// ============ Transaction helpers ============

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<ApiTransaction> {
  const res = await api
    .post("transactions", { json: input })
    .json<ApiResponse<ApiTransaction>>();
  return res.data;
}

export async function fetchTransactionById(
  id: string,
): Promise<ApiTransaction> {
  const res = await api
    .get(`transactions/${id}`)
    .json<ApiResponse<ApiTransaction>>();
  return res.data;
}

export async function uploadPaymentProof(
  transactionId: string,
  paymentProofUrl: string,
): Promise<ApiTransaction> {
  const res = await api
    .patch(`transactions/${transactionId}/payment-proof`, {
      json: { paymentProof: paymentProofUrl },
    })
    .json<ApiResponse<ApiTransaction>>();
  return res.data;
}

export async function cancelTransaction(
  transactionId: string,
): Promise<ApiTransaction> {
  const res = await api
    .patch(`transactions/${transactionId}/cancel`)
    .json<ApiResponse<ApiTransaction>>();
  return res.data;
}
// ============ Profile types ============

export interface ApiUserProfile {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ORGANIZER";
  referralCode: string;
  profileImage: string | null;
  createdAt: string;
  totalPoints: number;
  coupons: {
    id: string;
    code: string;
    discountAmount: number;
    expiresAt: string;
  }[];
}

export interface ApiTransactionListItem {
  id: string;
  invoiceNumber: string;
  status: TransactionStatus;
  totalPrice: number;
  finalPrice: number;
  createdAt: string;
  event: {
    id: string;
    name: string;
    venue: string;
    startDate: string;
  };
  items: {
    quantity: number;
    pricePerUnit: number;
    ticketType: { name: string };
  }[];
}

interface TransactionListData {
  transactions: ApiTransactionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ Profile helpers ============

export async function fetchProfile(): Promise<ApiUserProfile> {
  const res = await api.get("auth/profile").json<ApiResponse<ApiUserProfile>>();
  return res.data;
}

export async function fetchMyTransactions(
  params: { status?: TransactionStatus; page?: number; limit?: number } = {},
): Promise<TransactionListData> {
  const searchParams: Record<string, string> = {};
  if (params.status) searchParams.status = params.status;
  if (params.page) searchParams.page = String(params.page);
  if (params.limit) searchParams.limit = String(params.limit);

  const res = await api
    .get("transactions", { searchParams })
    .json<ApiResponse<TransactionListData>>();
  return res.data;
}
// ============ Review types ============

export interface ApiReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profileImage: string | null;
  };
}

interface ReviewListData {
  reviews: ApiReview[];
  summary: {
    averageRating: number;
    totalReviews: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ Review helpers ============

export async function fetchEventReviews(
  eventId: string,
  params: { page?: number; limit?: number } = {}
): Promise<ReviewListData> {
  const searchParams: Record<string, string> = {};
  if (params.page) searchParams.page = String(params.page);
  if (params.limit) searchParams.limit = String(params.limit);

  const res = await api
    .get(`reviews/events/${eventId}`, { searchParams })
    .json<ApiResponse<ReviewListData>>();
  return res.data;
}

export async function createReview(
  eventId: string,
  input: { rating: number; comment?: string }
): Promise<ApiReview> {
  const res = await api
    .post(`reviews/events/${eventId}`, { json: input })
    .json<ApiResponse<ApiReview>>();
  return res.data;
}

// ============ Dashboard types ============

export interface ApiDashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalTicketsSold: number;
  totalEvents: number;
  revenueByEvent: {
    eventId: string;
    eventName: string;
    revenue: number;
    transactions: number;
  }[];
  transactionsByStatus: {
    status: TransactionStatus;
    count: number;
  }[];
}

// ============ Dashboard helpers ============

export async function fetchDashboardStats(
  params: { year?: number; month?: number; day?: number } = {}
): Promise<ApiDashboardStats> {
  const searchParams: Record<string, string> = {};
  if (params.year) searchParams.year = String(params.year);
  if (params.month) searchParams.month = String(params.month);
  if (params.day) searchParams.day = String(params.day);

  const res = await api
    .get("dashboard/statistics", { searchParams })
    .json<ApiResponse<ApiDashboardStats>>();
  return res.data;
}
// ============ Organizer event types ============

export interface ApiOrganizerEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  venue: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  isFree: boolean;
  createdAt: string;
  ticketTypes: ApiTicketType[];
}

interface OrganizerEventListData {
  events: ApiOrganizerEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateEventInput {
  name: string;
  description: string;
  category: string;
  location: string;
  venue: string;
  startDate: string; // ISO string
  endDate: string;
  isFree: boolean;
  imageUrl?: string;
  ticketTypes: {
    name: string;
    price: number;
    totalSeats: number;
  }[];
}

// ============ Organizer event helpers ============

export async function fetchMyEvents(
  params: { page?: number; limit?: number } = {}
): Promise<OrganizerEventListData> {
  const searchParams: Record<string, string> = {};
  if (params.page) searchParams.page = String(params.page);
  if (params.limit) searchParams.limit = String(params.limit);

  const res = await api
    .get("events/organizer/my-events", { searchParams })
    .json<ApiResponse<OrganizerEventListData>>();
  return res.data;
}

export async function createEvent(
  input: CreateEventInput
): Promise<ApiOrganizerEvent> {
  const res = await api
    .post("events", { json: input })
    .json<ApiResponse<ApiOrganizerEvent>>();
  return res.data;
}

// ============ Organizer transaction types ============

export interface ApiOrganizerTransaction {
  id: string;
  invoiceNumber: string;
  status: TransactionStatus;
  totalPrice: number;
  finalPrice: number;
  pointsUsed: number;
  paymentProof: string | null;
  paymentDeadline: string;
  expiresAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    name: string;
  };
  items: {
    quantity: number;
    pricePerUnit: number;
    ticketType: { name: string };
  }[];
}

interface OrganizerTransactionListData {
  transactions: ApiOrganizerTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ Organizer transaction helpers ============

export async function fetchOrganizerTransactions(
  params: { status?: TransactionStatus; page?: number; limit?: number } = {}
): Promise<OrganizerTransactionListData> {
  const searchParams: Record<string, string> = {};
  if (params.status) searchParams.status = params.status;
  if (params.page) searchParams.page = String(params.page);
  if (params.limit) searchParams.limit = String(params.limit);

  const res = await api
    .get("transactions/organizer", { searchParams })
    .json<ApiResponse<OrganizerTransactionListData>>();
  return res.data;
}

export async function acceptTransaction(
  transactionId: string
): Promise<ApiTransaction> {
  const res = await api
    .patch(`transactions/${transactionId}/accept`)
    .json<ApiResponse<ApiTransaction>>();
  return res.data;
}

export async function rejectTransaction(
  transactionId: string
): Promise<ApiTransaction> {
  const res = await api
    .patch(`transactions/${transactionId}/reject`)
    .json<ApiResponse<ApiTransaction>>();
  return res.data;
}

// ============ Voucher types ============

export interface ApiVoucher {
  id: string;
  code: string;
  discountAmount: number;
  startDate: string;
  endDate: string;
  maxUsage: number;
  usedCount: number;
  eventId: string;
  createdAt: string;
}

interface CreateVoucherInput {
  code: string;
  discountAmount: number;
  startDate: string;
  endDate: string;
  maxUsage: number;
}

// ============ Voucher helpers ============

export async function fetchEventVouchers(
  eventId: string
): Promise<ApiVoucher[]> {
  const res = await api
    .get(`events/${eventId}/vouchers`)
    .json<ApiResponse<ApiVoucher[]>>();
  return res.data;
}

export async function createVoucher(
  eventId: string,
  input: CreateVoucherInput
): Promise<ApiVoucher> {
  const res = await api
    .post(`events/${eventId}/vouchers`, { json: input })
    .json<ApiResponse<ApiVoucher>>();
  return res.data;
}

// ============ Attendee types ============

export interface ApiAttendee {
  name: string;
  email: string;
  profileImage: string | null;
  invoiceNumber: string;
  tickets: {
    type: string;
    quantity: number;
    pricePerUnit: number;
  }[];
  totalQuantity: number;
  totalPaid: number;
  purchasedAt: string;
}

interface AttendeeListData {
  eventName: string;
  attendees: ApiAttendee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchEventAttendees(
  eventId: string,
  params: { page?: number; limit?: number } = {}
): Promise<AttendeeListData> {
  const searchParams: Record<string, string> = {};
  if (params.page) searchParams.page = String(params.page);
  if (params.limit) searchParams.limit = String(params.limit);

  const res = await api
    .get(`dashboard/events/${eventId}/attendees`, { searchParams })
    .json<ApiResponse<AttendeeListData>>();
  return res.data;
}