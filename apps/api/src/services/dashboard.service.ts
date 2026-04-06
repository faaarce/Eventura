import { prisma } from "../utils/prisma.js";
import { ApiError } from "../utils/helpers.js";

interface StatsQuery {
  year?: string;
  month?: string;
  day?: string;
}

interface AttendeeQuery {
  page?: string;
  limit?: string;
}

function buildDateFilter(query: StatsQuery) {
  const filter: { gte?: Date; lt?: Date } = {};

  if (query.year) {
    const year = parseInt(query.year);
    if (query.month) {
      const month = parseInt(query.month) - 1;
      if (query.day) {
        // Specific day
        const day = parseInt(query.day);
        filter.gte = new Date(year, month, day);
        filter.lt = new Date(year, month, day + 1);
      } else {
        // Specific month
        filter.gte = new Date(year, month, 1);
        filter.lt = new Date(year, month + 1, 1);
      }
    } else {
      // Specific year
      filter.gte = new Date(year, 0, 1);
      filter.lt = new Date(year + 1, 0, 1);
    }
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

export class DashboardService {
  async getStatistics(organizerId: string, query: StatsQuery) {
    const dateFilter = buildDateFilter(query);
    const dateWhere = dateFilter ? { createdAt: dateFilter } : {};

    const [revenue, ticketsSold, eventCount, revenueByEvent, transactionsByStatus] =
      await Promise.all([
        // Total revenue (DONE transactions only)
        prisma.transaction.aggregate({
          where: {
            event: { organizerId },
            status: "DONE",
            ...dateWhere,
          },
          _sum: { finalPrice: true },
          _count: true,
        }),

        // Total tickets sold
        prisma.transactionItem.aggregate({
          where: {
            transaction: {
              event: { organizerId },
              status: "DONE",
              ...dateWhere,
            },
          },
          _sum: { quantity: true },
        }),

        // Total events
        prisma.event.count({
          where: { organizerId, ...dateWhere },
        }),

        // Revenue grouped by event (for charts)
        prisma.transaction.groupBy({
          by: ["eventId"],
          where: {
            event: { organizerId },
            status: "DONE",
            ...dateWhere,
          },
          _sum: { finalPrice: true },
          _count: true,
        }),

        // Transaction count by status
        prisma.transaction.groupBy({
          by: ["status"],
          where: {
            event: { organizerId },
            ...dateWhere,
          },
          _count: true,
        }),
      ]);

    // Enrich revenueByEvent with event names
    const eventIds = revenueByEvent.map((r) => r.eventId);
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, name: true },
    });
    const eventMap = new Map(events.map((e) => [e.id, e.name]));

    return {
      totalRevenue: revenue._sum.finalPrice || 0,
      totalTransactions: revenue._count,
      totalTicketsSold: ticketsSold._sum.quantity || 0,
      totalEvents: eventCount,
      revenueByEvent: revenueByEvent.map((r) => ({
        eventId: r.eventId,
        eventName: eventMap.get(r.eventId) || "Unknown",
        revenue: r._sum.finalPrice || 0,
        transactions: r._count,
      })),
      transactionsByStatus: transactionsByStatus.map((t) => ({
        status: t.status,
        count: t._count,
      })),
    };
  }

  async getEvents(organizerId: string, query: { page?: string; limit?: string }) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { organizerId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          ticketTypes: {
            select: {
              id: true,
              name: true,
              price: true,
              availableSeats: true,
              totalSeats: true,
            },
          },
          _count: {
            select: {
              transactions: { where: { status: "DONE" } },
              reviews: true,
            },
          },
        },
      }),
      prisma.event.count({ where: { organizerId } }),
    ]);

    return {
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAttendees(organizerId: string, eventId: string, query: AttendeeQuery) {
    // Validate ownership
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, "Event not found");
    if (event.organizerId !== organizerId) {
      throw new ApiError(403, "You can only view attendees for your own events");
    }

    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          eventId,
          status: "DONE",
        },
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          invoiceNumber: true,
          finalPrice: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true, profileImage: true },
          },
          items: {
            select: {
              quantity: true,
              pricePerUnit: true,
              ticketType: { select: { name: true } },
            },
          },
        },
      }),
      prisma.transaction.count({
        where: { eventId, status: "DONE" },
      }),
    ]);

    // Calculate totals
    const attendees = transactions.map((trx) => ({
      name: trx.user.name,
      email: trx.user.email,
      profileImage: trx.user.profileImage,
      invoiceNumber: trx.invoiceNumber,
      tickets: trx.items.map((item) => ({
        type: item.ticketType.name,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
      })),
      totalQuantity: trx.items.reduce((sum, item) => sum + item.quantity, 0),
      totalPaid: trx.finalPrice,
      purchasedAt: trx.createdAt,
    }));

    return {
      eventName: event.name,
      attendees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
