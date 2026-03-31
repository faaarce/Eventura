import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Welcome to Eventura</h1>
      <Link
        to="/events"
        className="rounded-full bg-[var(--lagoon)] px-6 py-3 font-semibold text-white no-underline"
      >
        Browse Events
      </Link>
    </div>
  );
}