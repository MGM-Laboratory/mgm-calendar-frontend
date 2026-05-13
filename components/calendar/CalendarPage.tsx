"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../layout/PageHeader";
import { MonthJump } from "./MonthJump";
import { CalendarGrid } from "./CalendarGrid";
import { Legend } from "./Legend";
import { EventDetailModal } from "./EventDetailModal";
import { AdminAccessModal } from "../admin/AdminAccessModal";
import { fetchEventsByMonth } from "@/lib/api";
import { toMonthString } from "@/lib/date";
import { isLikelyAuthed } from "@/lib/auth";
import type { Event } from "@/lib/types";
import { AlertCircle } from "lucide-react";

export function CalendarPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex0, setMonthIndex0] = useState(now.getMonth());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  // ?login=1 → open admin modal on landing (used by AdminGuard redirects).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
      setAdminOpen(true);
      const u = new URL(window.location.href);
      u.searchParams.delete("login");
      window.history.replaceState(null, "", u.toString());
    }
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    fetchEventsByMonth(toMonthString(year, monthIndex0), { signal: ctrl.signal })
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setEvents(data);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        const msg =
          err instanceof Error ? err.message : "Tidak bisa memuat event.";
        setError(`${msg} · Periksa koneksi backend.`);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [year, monthIndex0]);

  const goPrev = useCallback(() => {
    setMonthIndex0((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
    setAnimKey((k) => k + 1);
  }, []);

  const goNext = useCallback(() => {
    setMonthIndex0((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
    setAnimKey((k) => k + 1);
  }, []);

  const goToday = useCallback(() => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonthIndex0(today.getMonth());
    setAnimKey((k) => k + 1);
  }, []);

  const jump = useCallback((y: number, m: number) => {
    setYear(y);
    setMonthIndex0(m);
    setAnimKey((k) => k + 1);
  }, []);

  return (
    <>
      <PageHeader
        year={year}
        monthIndex0={monthIndex0}
        onPrev={goPrev}
        onNext={goNext}
        onTodayClick={goToday}
        onAdminClick={() => {
          if (isLikelyAuthed()) {
            router.push("/admin");
          } else {
            setAdminOpen(true);
          }
        }}
      />

      <main className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-6 md:py-8">
        <div className="flex items-center justify-between gap-4 mb-4 md:mb-6 flex-wrap">
          <MonthJump year={year} monthIndex0={monthIndex0} onChange={jump} />
          {loading ? (
            <span
              className="text-caption text-ink-3"
              aria-live="polite"
              aria-busy="true"
            >
              Memuat event…
            </span>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-brand-red bg-brand-red-50 p-4 text-body-sm text-brand-red mb-6"
          >
            <AlertCircle
              className="h-5 w-5 mt-0.5 shrink-0"
              strokeWidth={2.25}
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        ) : null}

        <div key={animKey} className="mgm-slide-in">
          <CalendarGrid
            year={year}
            monthIndex0={monthIndex0}
            events={events}
            loading={loading}
            onEventClick={setSelectedEvent}
          />
          <Legend />
        </div>
      </main>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <AdminAccessModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </>
  );
}
