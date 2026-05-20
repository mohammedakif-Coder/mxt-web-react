
## Plan: UI polish for status labels, Activity time/filters, and Reports trend chart

### 1. Capitalize status labels everywhere
Audit every place a status string (`delivered`, `failed`, `pending`, `sent`, `paid`, `overdue`, `scheduled`, `draft`, `completed`, `approved`, `rejected`, `opted-out`, `closed`) renders directly from the DB. Add a small helper `formatStatus(s)` in `src/lib/utils.ts` that title-cases the value (`opted-out` → `Opted Out`). Replace raw `{status}` renders in:
- `src/pages/ActivityPage.tsx` — table badge + sheet badge
- `src/pages/CampaignsPage.tsx` — table badge + sheet badge
- `src/pages/BillingPage.tsx` — invoice status badge
- `src/pages/InboxPage.tsx` — "Closed" badge (already capitalized, verify)
- `src/pages/SendersPage.tsx` — sender status badges
- `src/pages/HomePage.tsx` — any inline status pills

This guarantees a leading capital letter even if the Tailwind `capitalize` class is dropped during a refactor (deterministic from data).

### 2. Activity tab — Time column with timestamp + relative subline
In `src/pages/ActivityPage.tsx`, change the Time cell to a two-line layout:

```text
Apr 22, 2026 · 3:42 PM
2 hours ago
```

- Top line: `format(date, "MMM d, h:mm a")` in `text-[12px]` foreground.
- Subline: `formatDistanceToNow(date, { addSuffix: true })` in `text-[10px] text-muted-foreground`.
- Widen the Time column to `w-[180px]`.
- Remove the existing "today vs older" branching — always show both lines for consistency.

### 3. Activity tab — Improve filter chip UI
Replace the current flat row of chips with a cleaner grouped toolbar:
- Wrap channel chips and status chips in their own subtle `bg-muted/40 rounded-xl px-2 py-1` groups, each prefixed by a tiny uppercase label ("Channel", "Status").
- Selected chip: `bg-primary text-primary-foreground` with a small check icon.
- Unselected chip: transparent background, `border border-border/40 text-foreground/70`, hover `bg-accent`.
- Increase chip height to `h-7`, padding `px-3`, font `text-[11px] font-medium`.
- Move the date-range button and CSV export into the same row, right-aligned, sharing the same height/radius for visual rhythm.
- Active filter chip-pills (the dismissible ones below) get a matching style and a subtle entrance animation.

Result: filters read as a single cohesive control strip rather than several mismatched buttons.

### 4. Reports tab — Message trend chart with intermediate date ticks + hover values
In `src/pages/ReportsPage.tsx` `<AreaChart>` for "Message Trends":
- Configure `XAxis` with `interval="preserveStartEnd"` plus a computed `ticks` array that picks ~6–8 evenly spaced dates from `trendData` (start, end, and intermediates) so labels appear along the axis instead of just two endpoints.
- Format tick labels as `MMM d`.
- Enable `<Tooltip>` cursor with a vertical line and ensure `ChartTooltipContent` shows the date plus per-channel counts (`SMS`, `MMS`, `WhatsApp`) and a total. Add `labelFormatter` that prints the full date (`MMM d, yyyy`).
- Keep gradients but slightly increase point visibility: add `dot={false}` for the line and `activeDot={{ r: 4 }}` so hover surfaces a clear marker over each date.
- Bump chart height to `h-[300px]` and reduce left margin so Y-axis is fully visible.

### Files touched
- `src/lib/utils.ts` — add `formatStatus`
- `src/pages/ActivityPage.tsx` — status capitalization, Time cell, filter UI
- `src/pages/CampaignsPage.tsx` — status capitalization
- `src/pages/BillingPage.tsx` — status capitalization
- `src/pages/SendersPage.tsx` — status capitalization
- `src/pages/InboxPage.tsx` — status capitalization (verify)
- `src/pages/ReportsPage.tsx` — trend chart ticks + tooltip

No DB, RLS, or schema changes. No new dependencies (`date-fns` and `recharts` already in use).
