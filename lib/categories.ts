import type { Category } from "./types";

export interface CategoryMeta {
  key: Category;
  label: string;
  defaultColor: string;
  /** Whether legend dots / chips need an outline to remain visible on white. */
  needsOutline: boolean;
  /** Whether the default text color on this fill is white (true) or ink (false). */
  textOnFillIsWhite: boolean;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "national_holiday",  label: "Hari Nasional",      defaultColor: "#f94141", needsOutline: false, textOnFillIsWhite: true  },
  { key: "religious_holiday", label: "Hari Keagamaan",     defaultColor: "#0f8657", needsOutline: false, textOnFillIsWhite: true  },
  { key: "joint_holiday",     label: "Cuti Bersama",       defaultColor: "#f7bf33", needsOutline: false, textOnFillIsWhite: false },
  { key: "internal",          label: "Acara Internal",     defaultColor: "#3a6dc5", needsOutline: false, textOnFillIsWhite: true  },
  { key: "big_event",         label: "Event Besar",        defaultColor: "#0e1116", needsOutline: false, textOnFillIsWhite: true  },
  { key: "midterm",           label: "UTS",                defaultColor: "#fee5e5", needsOutline: true,  textOnFillIsWhite: false },
  { key: "final",             label: "UAS",                defaultColor: "#c01f1f", needsOutline: false, textOnFillIsWhite: true  },
  { key: "seminar",           label: "Seminar / Workshop", defaultColor: "#ecf1fa", needsOutline: true,  textOnFillIsWhite: false },
];

export const CATEGORY_BY_KEY: Record<Category, CategoryMeta> =
  Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<Category, CategoryMeta>;

/**
 * Pick the foreground text color for a given event fill. Yellow is the
 * one fill that may NOT carry text on white (see design doc §2.4), so on
 * yellow we always use ink. For arbitrary admin-chosen colors, we fall
 * back to a luminance heuristic.
 */
export function textColorForFill(fill: string): "#0e1116" | "#ffffff" {
  const f = fill.toLowerCase();
  // Yellow family — always ink.
  if (f === "#f7bf33" || f === "#fef6e0") return "#0e1116";
  // Known light tints — ink.
  if (f === "#fee5e5" || f === "#ecf1fa" || f === "#e2f1ea") return "#0e1116";
  return luminance(f) > 0.55 ? "#0e1116" : "#ffffff";
}

function luminance(hex: string): number {
  const m = hex.replace("#", "");
  if (m.length !== 6) return 0;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
