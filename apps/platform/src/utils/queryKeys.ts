export const queryKeys = {
  events: {
    all: ['events'] as const,
    list: (filters: Record<string, unknown>) => ['events', 'list', filters] as const,
    bySlug: (slug: string) => ['events', 'slug', slug] as const,
    byId: (id: string) => ['events', 'id', id] as const,
    myEvents: (filters: Record<string, unknown>) => ['events', 'my', filters] as const,
    reviews: (eventId: string) => ['events', eventId, 'reviews'] as const,
    vouchers: (eventId: string) => ['events', eventId, 'vouchers'] as const,
    attendees: (eventId: string) => ['events', eventId, 'attendees'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    my: (filters: Record<string, unknown>) => ['transactions', 'my', filters] as const,
    byId: (id: string) => ['transactions', 'id', id] as const,
    organizer: (filters: Record<string, unknown>) => ['transactions', 'organizer', filters] as const,
  },
  profile: ['profile'] as const,
  dashboard: {
    stats: (filters: Record<string, unknown>) => ['dashboard', 'stats', filters] as const,
  },
  organizer: {
    profile: (id: string) => ['organizer', 'profile', id] as const,
  },
}