import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] text-white">
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