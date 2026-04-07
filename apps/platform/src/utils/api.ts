
import ky from "ky";

export const api = ky.create({
  prefixUrl: "http://localhost:8000/api",
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem("token");
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
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
  } = {}
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
  code: string
): Promise<{ valid: boolean; code: string; discountAmount: number }> {
  const res = await api
    .get(`events/${eventId}/vouchers/verify/${code}`)
    .json<ApiResponse<{ valid: boolean; code: string; discountAmount: number; remainingUsage: number }>>();
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
  input: CreateTransactionInput
): Promise<ApiTransaction> {
  const res = await api
    .post("transactions", { json: input })
    .json<ApiResponse<ApiTransaction>>();
  return res.data;
}

export async function fetchTransactionById(
  id: string
): Promise<ApiTransaction> {
  const res = await api
    .get(`transactions/${id}`)
    .json<ApiResponse<ApiTransaction>>();
  return res.data;
}

export async function uploadPaymentProof(
  transactionId: string,
  paymentProofUrl: string
): Promise<ApiTransaction> {
  const res = await api
    .patch(`transactions/${transactionId}/payment-proof`, {
      json: { paymentProof: paymentProofUrl },
    })
    .json<ApiResponse<ApiTransaction>>();
  return res.data;
}

export async function cancelTransaction(
  transactionId: string
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
  params: { status?: TransactionStatus; page?: number; limit?: number } = {}
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