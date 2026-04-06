import { prisma } from "../utils/prisma.js";
import { ApiError } from "../utils/helpers.js";

interface CreateReviewInput {
  rating: number;
  comment?: string;
}

export class ReviewService {
  async create(userId: string, eventId: string, input: CreateReviewInput) {
    // 1. Event must exist
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, "Event not found");

    // 2. Event must have ended
    if (new Date(event.endDate) > new Date()) {
      throw new ApiError(400, "You can only review events that have ended");
    }

    // 3. User must have a DONE transaction for this event
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId,
        eventId,
        status: "DONE",
      },
    });
    if (!transaction) {
      throw new ApiError(400, "You can only review events you have attended");
    }

    // 4. Check if already reviewed (unique constraint will catch this too)
    const existing = await prisma.review.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) {
      throw new ApiError(400, "You have already reviewed this event");
    }

    return await prisma.review.create({
      data: {
        rating: input.rating,
        comment: input.comment,
        userId,
        eventId,
      },
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
      },
    });
  }

  async listByEvent(eventId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { eventId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
      }),
      prisma.review.count({ where: { eventId } }),
      prisma.review.aggregate({
        where: { eventId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      reviews,
      summary: {
        averageRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : 0,
        totalReviews: aggregate._count.rating,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrganizerReviews(organizerId: string) {
    const aggregate = await prisma.review.aggregate({
      where: { event: { organizerId } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const recentReviews = await prisma.review.findMany({
      where: { event: { organizerId } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
        event: { select: { id: true, name: true } },
      },
    });

    return {
      averageRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : 0,
      totalReviews: aggregate._count.rating,
      recentReviews,
    };
  }
}
