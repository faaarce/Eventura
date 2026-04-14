import ky, { type BeforeRequestHook, type AfterResponseHook } from "ky";
import Cookies from "js-cookie";

const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  credentials: "include", // ← PENTING: kirim cookie (refreshToken) ke backend
  hooks: {
    beforeRequest: [
      (request) => {
        const token = Cookies.get("token");
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      // Auto-refresh: kalau dapat 401, coba refresh token
      async (request, options, response) => {
        if (response.status !== 401) return response;

        // Jangan infinite loop — kalau refresh endpoint sendiri 401, stop
        if (request.url.includes("/auth/refresh")) return response;
        if (request.url.includes("/auth/login")) return response;

        try {
          // Call refresh endpoint — browser otomatis kirim refreshToken cookie
          const refreshRes = await ky
            .post(
              `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/auth/refresh`,
              { credentials: "include" },
            )
            .json<{ success: boolean; data: { token: string } }>();

          if (refreshRes.success && refreshRes.data.token) {
            // Simpan access token baru
            Cookies.set("token", refreshRes.data.token, { expires: 1 });

            // Retry request original dengan token baru
            request.headers.set(
              "Authorization",
              `Bearer ${refreshRes.data.token}`,
            );
            return ky(request);
          }
        } catch {
          // Refresh gagal — force logout
          Cookies.remove("token");
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        }

        return response;
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
    organizerId?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<EventListData> {
  const searchParams: Record<string, string> = {};
  if (params.search) searchParams.search = params.search;
  if (params.category) searchParams.category = params.category;
  if (params.isFree !== undefined) searchParams.isFree = String(params.isFree);
  if (params.organizerId) searchParams.organizerId = params.organizerId;
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
  file: File,
): Promise<ApiTransaction> {
  const formData = new FormData();
  formData.append("paymentProof", file);

  const res = await api
    .patch(`transactions/${transactionId}/payment-proof`, { body: formData })
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
  params: { page?: number; limit?: number } = {},
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
  input: { rating: number; comment?: string },
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
  params: { year?: number; month?: number; day?: number } = {},
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
  params: { page?: number; limit?: number } = {},
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
  input: CreateEventInput,
  file?: File,
): Promise<ApiOrganizerEvent> {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("description", input.description);
  formData.append("category", input.category);
  formData.append("location", input.location);
  formData.append("venue", input.venue);
  formData.append("startDate", input.startDate);
  formData.append("endDate", input.endDate);
  formData.append("isFree", String(input.isFree));
  formData.append("ticketTypes", JSON.stringify(input.ticketTypes));
  if (file) formData.append("image", file);

  const res = await api
    .post("events", { body: formData })
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
  params: { status?: TransactionStatus; page?: number; limit?: number } = {},
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
  transactionId: string,
): Promise<ApiTransaction> {
  const res = await api
    .patch(`transactions/${transactionId}/accept`)
    .json<ApiResponse<ApiTransaction>>();
  return res.data;
}

export async function rejectTransaction(
  transactionId: string,
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
  eventId: string,
): Promise<ApiVoucher[]> {
  const res = await api
    .get(`events/${eventId}/vouchers`)
    .json<ApiResponse<ApiVoucher[]>>();
  return res.data;
}

export async function createVoucher(
  eventId: string,
  input: CreateVoucherInput,
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
  params: { page?: number; limit?: number } = {},
): Promise<AttendeeListData> {
  const searchParams: Record<string, string> = {};
  if (params.page) searchParams.page = String(params.page);
  if (params.limit) searchParams.limit = String(params.limit);

  const res = await api
    .get(`dashboard/events/${eventId}/attendees`, { searchParams })
    .json<ApiResponse<AttendeeListData>>();
  return res.data;
}

export async function updateProfile(
  input: { name?: string },
  file?: File,
): Promise<{
  id: string;
  name: string;
  email: string;
  role: string;
  referralCode: string;
  profileImage: string | null;
  createdAt: string;
}> {
  const formData = new FormData();
  if (input.name) formData.append("name", input.name);
  if (file) formData.append("profileImage", file);

  const res = await api
    .patch("auth/profile", { body: formData })
    .json<ApiResponse<any>>();
  return res.data;
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const res = await api
    .patch("auth/change-password", { json: input })
    .json<ApiResponse<{ message: string }>>();
  return res.data;
}

interface UpdateEventInput {
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
}

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput,
  file?: File,
): Promise<ApiOrganizerEvent> {
  if (file) {
    const formData = new FormData();
    if (input.name) formData.append("name", input.name);
    if (input.description) formData.append("description", input.description);
    if (input.category) formData.append("category", input.category);
    if (input.location) formData.append("location", input.location);
    if (input.venue) formData.append("venue", input.venue);
    if (input.startDate) formData.append("startDate", input.startDate);
    if (input.endDate) formData.append("endDate", input.endDate);
    formData.append("image", file);

    const res = await api
      .put(`events/${eventId}`, { body: formData })
      .json<ApiResponse<ApiOrganizerEvent>>();
    return res.data;
  }

  // Tanpa file — kirim JSON biasa
  const res = await api
    .put(`events/${eventId}`, { json: input })
    .json<ApiResponse<ApiOrganizerEvent>>();
  return res.data;
}

export async function forgotPassword(
  email: string,
): Promise<{ message: string }> {
  const res = await api
    .post("auth/forgot-password", { json: { email } })
    .json<ApiResponse<{ message: string }>>();
  return res.data;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await api
    .post("auth/reset-password", { json: { token, newPassword } })
    .json<ApiResponse<{ message: string }>>();
  return res.data;
}

export interface ApiOrganizerProfile {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  createdAt: string;
  totalEvents: number;
  averageRating: number;
  totalReviews: number;
  recentReviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { id: string; name: string; profileImage: string | null };
    event: { id: string; name: string };
  }[];
}

export async function fetchOrganizerProfile(
  organizerId: string,
): Promise<ApiOrganizerProfile> {
  const res = await api
    .get(`auth/organizer/${organizerId}`)
    .json<ApiResponse<ApiOrganizerProfile>>();
  return res.data;
}

export async function logoutApi(): Promise<void> {
  try {
    await api.post("auth/logout").json();
  } catch {
    // Ignore — logout best-effort
  }
}
 