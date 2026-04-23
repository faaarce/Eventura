import { prisma } from "../utils/prisma.js";
import { ApiError } from "../utils/helpers.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import { generateSlug } from "../utils/generate-slug.js"; 

interface CreateEventInput {
  name: string;
  description: string;
  category: string;
  location: string;
  venue: string;
  startDate: string;
  endDate: string;
  isFree: boolean;
  imageUrl?: string;
  ticketTypes: { name: string; price: number; totalSeats: number }[];
}

interface EventQuery {
  search?: string;
  category?: string;
  location?: string;
  isFree?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  organizerId?: string;
}


async function generateUniqueSlug(
  name: string,
  excludeEventId?: string,
): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.event.findFirst({
      where: {
        slug,
        ...(excludeEventId && { NOT: { id: excludeEventId } }),
      },
    });

    if (!existing) break; 

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function create(
  organizerId: string,
  input: CreateEventInput,
  file?: Express.Multer.File,
) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (startDate >= endDate)
    throw new ApiError(400, "End date must be after start date");
  if (startDate <= new Date())
    throw new ApiError(400, "Start date must be in the future");
  if (input.isFree && input.ticketTypes.some((t) => t.price > 0)) {
    throw new ApiError(400, "Free events cannot have paid ticket types");
  }

  
  const slug = await generateUniqueSlug(input.name);

  let imageUrl = input.imageUrl;
  if (file) {
    const { secure_url } = await uploadImage(file, "eventura/events");
    imageUrl = secure_url;
  }

  return await prisma.event.create({
    data: {
      name: input.name,
      slug, 
      description: input.description,
      category: input.category,
      location: input.location,
      venue: input.venue,
      startDate,
      endDate,
      isFree: input.isFree,
      imageUrl,
      organizerId,
      ticketTypes: {
        create: input.ticketTypes.map((t) => ({
          name: t.name,
          price: input.isFree ? 0 : t.price,
          totalSeats: t.totalSeats,
          availableSeats: t.totalSeats,
        })),
      },
    },
    include: {
      ticketTypes: true,
      organizer: { select: { id: true, name: true, profileImage: true } },
    },
  });
}

export async function findAll(query: EventQuery) {
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "startDate";
  const sortOrder = (query.sortOrder || "asc") as "asc" | "desc";

  const where: Record<string, unknown> = { endDate: { gte: new Date() } };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.category)
    where.category = { equals: query.category, mode: "insensitive" };
  if (query.location)
    where.location = { contains: query.location, mode: "insensitive" };
  if (query.isFree !== undefined) where.isFree = query.isFree === "true";
  if (query.organizerId) where.organizerId = query.organizerId;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        ticketTypes: true,
        organizer: { select: { id: true, name: true, profileImage: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}


export async function findById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: true,
      organizer: {
        select: { id: true, name: true, profileImage: true, email: true },
      },
    },
  });
  if (!event) throw new ApiError(404, "Event not found");
  return event;
}


export async function findBySlug(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      ticketTypes: true,
      organizer: {
        select: { id: true, name: true, profileImage: true, email: true },
      },
    },
  });
  if (!event) throw new ApiError(404, "Event not found");
  return event;
}

export async function update(
  eventId: string,
  organizerId: string,
  input: Partial<CreateEventInput>,
  file?: Express.Multer.File,
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiError(404, "Event not found");
  if (event.organizerId !== organizerId)
    throw new ApiError(403, "You can only edit your own events");

  // Regenerate slug kalau name berubah
  let slug = event.slug;
  if (input.name && input.name !== event.name) {
    slug = await generateUniqueSlug(input.name, eventId);
  }

  let imageUrl: string | undefined;
  if (file) {
    if (event.imageUrl) {
      try {
        await deleteImage(event.imageUrl);
      } catch {
      
      }
    }
    const { secure_url } = await uploadImage(file, "eventura/events");
    imageUrl = secure_url;
  }

  return await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(input.name && { name: input.name }),
      ...(slug !== event.slug && { slug }), // ← update slug kalau berubah
      ...(input.description && { description: input.description }),
      ...(input.category && { category: input.category }),
      ...(input.location && { location: input.location }),
      ...(input.venue && { venue: input.venue }),
      ...(input.startDate && { startDate: new Date(input.startDate) }),
      ...(input.endDate && { endDate: new Date(input.endDate) }),
      ...(imageUrl !== undefined && { imageUrl }),
    },
    include: {
      ticketTypes: true,
      organizer: { select: { id: true, name: true } },
    },
  });
}

export async function remove(eventId: string, organizerId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiError(404, "Event not found");
  if (event.organizerId !== organizerId)
    throw new ApiError(403, "You can only delete your own events");

  await prisma.event.delete({ where: { id: eventId } });
  return { message: "Event deleted successfully" };
}

export async function getOrganizerEvents(
  organizerId: string,
  query: EventQuery,
) {
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { ticketTypes: true },
    }),
    prisma.event.count({ where: { organizerId } }),
  ]);

  return {
    events,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}