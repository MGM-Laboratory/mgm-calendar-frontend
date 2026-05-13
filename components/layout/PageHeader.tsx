"use client";

import { Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";
import { Wordmark } from "./Wordmark";
import { PatternCorner } from "./PatternCorner";
import { MONTHS_ID } from "@/lib/date";

interface Props {
  year: number;
  monthIndex0: number;
  onPrev: () => void;
  onNext: () => void;
  /** When omitted, the Admin Panel button is hidden. */
  onAdminClick?: () => void;
  onTodayClick: () => void;
}

export function PageHeader({
  year,
  monthIndex0,
  onPrev,
  onNext,
  onAdminClick,
  onTodayClick,
}: Props) {
  return (
    <header className="relative overflow-hidden border-b border-line bg-white">
      {/* Pattern lives in the top-right corner, ~20% of the header. Decorative only. */}
      <PatternCorner
        corner="tr"
        className="pointer-events-none absolute -top-4 -right-4 h-[160px] w-[160px] md:h-[200px] md:w-[200px] opacity-95"
      />
      <div className="relative max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-8 md:py-10">
        <div className="flex items-center justify-between gap-6">
          <Wordmark />
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onPrev} aria-label="Bulan sebelumnya">
              <ChevronLeft className="w-4 h-4" strokeWidth={2.25} />
              Sebelumnya
            </Button>
            <Button variant="ghost" size="md" onClick={onTodayClick} aria-label="Kembali ke bulan ini">
              Hari Ini
            </Button>
            <Button variant="ghost" size="md" onClick={onNext} aria-label="Bulan berikutnya">
              Berikutnya
              <ChevronRight className="w-4 h-4" strokeWidth={2.25} />
            </Button>
            {onAdminClick ? (
              <Button variant="secondary" size="md" onClick={onAdminClick}>
                <Lock className="w-4 h-4" strokeWidth={2.25} />
                Admin Panel
              </Button>
            ) : null}
          </div>
        </div>
        <h1 className="mt-8 md:mt-10 font-display text-display-lg md:text-display-xl text-ink leading-[1.05] tracking-tight">
          {MONTHS_ID[monthIndex0]} <span className="text-ink-3 font-normal tnum">{year}</span>
        </h1>

        {/* Mobile action row */}
        <div className="md:hidden mt-6 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onPrev}>
            <ChevronLeft className="w-4 h-4" strokeWidth={2.25} />
            Sebelumnya
          </Button>
          <Button variant="ghost" size="sm" onClick={onTodayClick}>
            Hari Ini
          </Button>
          <Button variant="ghost" size="sm" onClick={onNext}>
            Berikutnya
            <ChevronRight className="w-4 h-4" strokeWidth={2.25} />
          </Button>
          {onAdminClick ? (
            <Button variant="secondary" size="sm" onClick={onAdminClick}>
              <Lock className="w-4 h-4" strokeWidth={2.25} />
              Admin
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
