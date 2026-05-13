# mgm-calendar-frontend

Public calendar **and** admin panel for the MGM Laboratory Event Calendar.
Next.js 15 + App Router + Tailwind 3, themed to the MGM Laboratory Design
System.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router, standalone output) |
| Language | TypeScript |
| Styles | Tailwind 3, CSS variables for design tokens |
| Fonts | Bricolage Grotesque (display) + Geist (sans) + Geist Mono via `next/font/google` |
| Icons | `lucide-react` (stroke 2.25, per design doc §8) |
| Rich text | TipTap v2 (StarterKit + Underline + Link + Image + YouTube + Placeholder + custom Audio node) |

## Quick start (local dev)

```bash
cp .env.example .env.local       # only var is NEXT_PUBLIC_API_URL
npm install
npm run dev                      # http://localhost:3000
```

Make sure the backend is running on `http://localhost:8080`
(`docker compose up` in `../mgm-calendar-backend/`).

## Quick start (Docker)

```bash
cp .env.example .env             # docker-compose reads .env at build time
docker compose up --build        # http://localhost:3000
```

The Dockerfile bakes `NEXT_PUBLIC_API_URL` into the JS bundle at build
time, so override it via the build arg if your backend lives elsewhere:

```bash
docker compose build --build-arg NEXT_PUBLIC_API_URL=https://api.mgm-lab.id
```

## Project layout

```
app/
  layout.tsx                       Root layout (fonts, locale)
  globals.css                      Tailwind directives + design tokens + keyframes
  page.tsx                         Public calendar
  not-found.tsx                    404 with corner pattern
  admin/
    layout.tsx                     AdminGuard + AdminBanner
    page.tsx                       Admin calendar
    events/
      new/page.tsx                 New-event editor (?date= for prefilled day)
      [id]/edit/page.tsx           Edit-event editor

components/
  ui/                              Button, Modal, Skeleton
  layout/                          PatternCorner, ShapeSignature, Wordmark, PageHeader
  calendar/                        Public calendar — CalendarPage, CalendarGrid,
                                   DayCell, EventChip, MonthJump, Legend,
                                   EventDetailModal
  admin/
    AdminAccessModal.tsx           Real password login
    AdminGuard.tsx                 Client-side session probe
    AdminBanner.tsx                Inverse-dark sticky banner
    AdminCalendarPage.tsx          Admin calendar orchestrator
    DayEventsDrawer.tsx            Right slide-in drawer
    editor/
      EventEditor.tsx              Two-column editor orchestrator
      TipTapEditor.tsx             Rich-text editor wrapper
      EditorToolbar.tsx            Toolbar (B/I/U/S, H1-3, lists, quote, code,
                                   hr, link, image, file, audio, YouTube, undo/redo)
      ColorPicker.tsx              MGM-palette swatches only
      CategorySelect.tsx           Category dropdown with color dot
      ThumbnailField.tsx           Single-image S3 upload + preview
      AttachmentsField.tsx         Multi-file S3 upload list
      AttendeesField.tsx           Tag-style multi-input
      RecurrenceField.tsx          UI builder → iCal RRULE string
      SaveBar.tsx                  Sticky bottom Draft / Publish / Delete bar
      extensions/audio.ts          Custom TipTap node for <audio controls>

lib/
  types.ts                         Event, Category, Attachment
  categories.ts                    Category metadata + textColorForFill
  date.ts                          Indonesian formatters + matrix builder
  api.ts                           Public fetch wrappers
  admin-api.ts                     Admin CRUD + uploads (Authorization header)
  auth.ts                          Token storage (localStorage)
  tiptap.ts                        Sanitising TipTap-JSON → HTML renderer
```

## Auth flow

1. User clicks **Admin Panel** on `/`. If a token is already in
   localStorage they go straight to `/admin`; otherwise the login modal
   opens.
2. `POST /api/admin/auth` with `{ password }`. The backend sets an
   `httpOnly` `mgm_admin_token` cookie **and** returns `{ token, expires_at }`.
3. The frontend stores the token in `localStorage` under
   `mgm_admin_token` and attaches it as `Authorization: Bearer …` on
   every admin request. (The cookie is a same-origin backup; cross-origin
   browsers won't send a `SameSite=Lax` cookie on fetch.)
4. `AdminGuard` mounts on every `/admin/*` route and probes
   `/api/admin/me`. 401 → redirect to `/?login=1`, which re-opens the
   modal.
5. The **Keluar** button in `AdminBanner` POSTs `/api/admin/logout` and
   clears the token, then `router.replace('/')`.

## Admin calendar

- Inverse-dark banner at the top with **Mode Admin** + a "Lihat Publik"
  link (new tab) and "Keluar".
- Same calendar grid as the public view, but every day cell exposes a
  hover/focus-only `+ Tambah` affordance and the entire cell is
  clickable.
- Clicking an event chip → admin variant of the popup with an **Edit**
  button (pencil icon) next to the category badge. Recurring instances
  bounce to the parent for editing.
- Clicking an empty cell (or `+ Tambah`) → if the day has no events,
  goes directly to `/admin/events/new?date=YYYY-MM-DD`. If the day has
  events, the **Day Events Drawer** slides in from the right, listing
  each event with its own Edit button and a primary **Tambah Event
  Baru** at the bottom.
- A dedicated `Event Baru` button next to the month-jump is the
  no-context fallback.

## Event editor

`/admin/events/new` and `/admin/events/[id]/edit` share `EventEditor.tsx`
— a two-column page (60% rich-text body / 40% metadata sidebar on
desktop, stacks on mobile):

| Left | Right (sidebar) |
|---|---|
| Title input (h3 size) | Category dropdown (with default color dot) |
| TipTap rich-text body with full toolbar | Color picker (MGM palette only — design §2.5) |
| | Thumbnail (S3 upload, 16:9 preview, removable) |
| | All-day toggle |
| | Start date + time (hidden when all-day) |
| | End date + time (hidden when all-day) |
| | Location type toggle (Fisik / Online / Hybrid) |
| | Location text (Fisik / Hybrid) |
| | Meeting link (Online / Hybrid) |
| | Dresscode |
| | Attendees (tag-style chips) |
| | Recurrence (None / Daily / Weekly / Monthly / Yearly, weekday picker for Weekly, ends Never / On date / After N) |
| | Attachments (multi-file S3 upload with remove) |

A sticky bottom **SaveBar** holds the actions:
- **Simpan Draft** (secondary) — saves with `is_published=false`
- **Publikasikan** (primary) — saves with `is_published=true`
- **Hapus Event** (destructive ghost, edit only) — shows inline
  confirmation alert in the bar itself (not a modal-on-modal); for
  seeded holidays the alert text changes to warn first

### Recurrence → RRULE

The recurrence UI is a simple form whose output is a single iCal
`RRULE`. Mapping:

| UI | Output |
|---|---|
| Tidak berulang | `recurrence_rule = null` |
| Setiap hari | `FREQ=DAILY` |
| Setiap minggu, Sen + Rab | `FREQ=WEEKLY;BYDAY=MO,WE` |
| Setiap bulan | `FREQ=MONTHLY` |
| Setiap tahun | `FREQ=YEARLY` |
| Berakhir: Pada tanggal | `recurrence_end_date = "YYYY-MM-DD"` (separate column; not in RRULE) |
| Berakhir: Setelah N kali | appended as `;COUNT=N` |

The backend materialises instances on every save (up to 2 years from
the parent's start), so the calendar shows real rows you can navigate
to. Children link back to the parent via `parent_event_id`.

### Timestamps

The editor's date/time pickers are interpreted as **Asia/Jakarta (WIB)**
regardless of the admin's browser timezone, so an event entered as
"14:00 on 18 Mei 2026" is stored as `2026-05-18T14:00:00+07:00`.
Round-tripping on Edit goes through `Intl.DateTimeFormat` with
`timeZone: "Asia/Jakarta"` to display the same wall-clock time the admin
typed.

## Design system mapping

Every token from `mgm-laboratory-design-system.md` is wired:

- **Colors** (§2.1): `bg-brand-blue`, `text-ink-2`, `bg-surface-muted`, etc.
- **Type scale** (§3.2): `text-display-xl`, `text-h2`, `text-body-sm`, `text-eyebrow`.
- **Radii** (§4.5): `rounded` (12px default), `rounded-lg` (20px), `rounded-xl` (28px modal).
- **Shadows** (§2.1): `shadow-1` (cells), `shadow-2` (save bar / drawer card), `shadow-3` (modal + editor panel).
- **Motion** (§6.1): `ease-out-soft`, `duration-120/200/320`, with `mgm-slide-in` / `mgm-modal-in` / `mgm-drawer-in` keyframes in `globals.css`.
- **Pattern** (§5): `components/layout/PatternCorner.tsx` ports the verbatim SVG, used only in the page header corner and the 404 illustration.
- **Reduced motion** (§6.4): handled globally in `globals.css`.

## Behavioural details

- Week starts on **Monday** (`Sen`, `Sel`, `Rab`, `Kam`, `Jum`, `Sab`, `Min`).
- "Today" is a filled `--brand-blue` circle around the date number.
- Days outside the current month use `--surface-muted` background and `--ink-4` text. Color only ever lives in the chips.
- Each cell shows up to 3 chips; overflow becomes `+N lainnya` (admin: opens drawer; public: inert).
- Date format: `14 Mei 2026`. Time format: `13.00 WIB`.
- Loading uses chip-skeletons in in-month cells; no first-paint spinners (design §13.17).
- TipTap renderer in `lib/tiptap.ts` only allows `http(s)`, `mailto`, relative, and `data:image/*` URLs.
- Admin's color picker is restricted to the MGM palette (design §2.5 — "the palette is closed").

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server on `:3000` |
| `npm run build` | Production build (`output: "standalone"`) |
| `npm run start` | Run the built server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` |

## Known limitations

- Admin sessions are token-only (no refresh). After 8 hours the next
  admin request returns 401 and the user is bounced back to the login
  modal.
- Token lives in `localStorage` — adequate for an internal admin tool
  with a single shared password, not suitable if the page renders
  third-party content. The httpOnly cookie is also set as a defence in
  depth.
- File upload progress is not surfaced — the SDK uses a single fetch,
  no `XMLHttpRequest` for `progress` events.
- Recurrence editing always regenerates children on save; per-instance
  edits and exceptions (RFC 5545 `EXDATE`) are not supported.
