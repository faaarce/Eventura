import { Music, Headphones } from "lucide-react";

export function BrowsePromo() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/6">
      <div className="flex flex-col items-start gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="relative z-10 max-w-md">
          <h3 className="display-title text-xl font-bold leading-snug text-white sm:text-2xl md:text-3xl">
            Find shows by artists you're into
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Connect your Spotify or Apple Music
          </p>

          <div className="mt-5 flex flex-wrap gap-3 sm:mt-6">
            <button className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0a0a0a] sm:px-5 sm:py-2.5">
              <Music size={16} />
              SPOTIFY
            </button>
            <button className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0a0a0a] sm:px-5 sm:py-2.5">
              <Headphones size={16} />
              APPLE MUSIC
            </button>
          </div>
        </div>

        <div className="hidden shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/4 md:flex md:h-40 md:w-40">
          <Headphones size={64} className="text-white/15" />
        </div>
      </div>
    </div>
  );
}
