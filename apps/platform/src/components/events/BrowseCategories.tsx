import {
  Mic2,
  PartyPopper,
  Presentation,
  Music,
  Trophy,
  Laugh,
} from "lucide-react";
import type { EventCategory } from "@/types/event";
import type { LucideIcon } from "lucide-react";

interface Category {
  key: EventCategory;
  label: string;
  icon: LucideIcon;
}

const categories: Category[] = [
  { key: "conference", label: "Talks", icon: Presentation },
  { key: "party", label: "Party", icon: PartyPopper },
  { key: "workshop", label: "Workshop", icon: Mic2 },
  { key: "concert", label: "Concert", icon: Music },
  { key: "sports", label: "Sports", icon: Trophy },
  { key: "meetup", label: "Comedy", icon: Laugh },
];

interface BrowseCategoriesProps {
  active: EventCategory | null;
  onSelect: (category: EventCategory | null) => void;
}

export function BrowseCategories({ active, onSelect }: BrowseCategoriesProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="flex gap-2.5 sm:flex-wrap sm:gap-3">
        {categories.map((cat) => {
          const isActive = active === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelect(isActive ? null : cat.key)}
              className={`flex shrink-0 flex-col items-center justify-center gap-2 rounded-xl transition-all duration-150 cursor-pointer
                h-20 w-20 sm:h-22
                ${
                  isActive
                    ? "border-[1.5px] border-white/50 bg-white/12"
                    : "border border-white/12 bg-white/4"
                }`}
            >
              <cat.icon
                size={22}
                className={isActive ? "text-white" : "text-white/50"}
              />
              <span
                className={`text-[11px] font-semibold ${
                  isActive ? "text-white" : "text-white/50"
                }`}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
