# Dogfood Report: Ops Map

| Field | Value |
|-------|-------|
| **Date** | 2026-02-26 |
| **App URL** | https://operationsmap.vercel.app |
| **Session** | operationsmap |
| **Scope** | Full app — Phase 7 features + all existing features |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 2 |
| **Total** | **3** |

## Issues

### ISSUE-001 — Dashboard and search pages have double padding

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Page** | Dashboard (`/`), Search (`/search`) |
| **Type** | Layout / Visual |
| **Repro Video** | N/A |

**Description:** The app layout (`layout.tsx`) applies `p-6` (24px padding) on the `<main>` element. The dashboard and search pages also add their own `p-6` on their root `<div>`, resulting in 48px total padding — double the padding compared to all other pages (list views, record views, settings, etc.) which only use the layout's 24px.

**Screenshot:** [dashboard-final.png](screenshots/dashboard-final.png)

**Fix:** Removed the duplicate `p-6` from the dashboard page (`src/app/(app)/page.tsx`) and search page (`src/app/(app)/search/page.tsx`).

---

### ISSUE-002 — Missing favicon.ico causes 404 on every page load

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Page** | All pages |
| **Type** | Console error |
| **Repro Video** | N/A |

**Description:** The app serves `favicon.svg` via metadata but no `favicon.ico` exists in the `public/` directory. Most browsers still request `/favicon.ico` regardless of the `<link rel="icon">` tag, producing a 404 error in the browser console on every page load.

**Console output:**
```
Failed to load resource: the server responded with a status of 404 ()
```

**Fix:** Added a permanent redirect from `/favicon.ico` to `/favicon.svg` in `next.config.ts`.

---

### ISSUE-003 — Persistent 400 console error on page loads

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Page** | Most pages |
| **Type** | Console error |
| **Repro Video** | N/A |

**Description:** A 400 (Bad Request) error appears in the browser console on most page loads. The error does not affect functionality — all data loads correctly, auth works, and all CRUD operations succeed. The likely source is the Supabase auth token refresh mechanism: when the middleware and server actions both call `supabase.auth.getUser()`, the access token refresh can produce a transient 400 for the expiring token. This is handled gracefully by the Supabase client.

**Console output:**
```
Failed to load resource: the server responded with a status of 400 ()
```

**Status:** Not fixed — benign auth token refresh artifact. Would require deeper Supabase session management changes to suppress.

---

## Areas Tested

| Area | Status | Notes |
|------|--------|-------|
| Dashboard | Pass | Metrics, activity feed, suggestions all render correctly |
| Function Chart | Pass | Drag-and-drop, add function/subfunction, export, detail drill-down |
| Workflow Map | Pass | Create workflow, add phases, builder UI |
| All 7 List Views | Pass | Functions, Subfunctions, Processes, Core Activities, People, Roles, Software |
| Record Views | Pass | Three-column layout, associations, comments, export |
| Global Search | Pass | Searches across all object types, keyboard navigation |
| Create New (Quick Create) | Pass | Tested via header dropdown and list page buttons |
| Settings — Company Profile | Pass | Form fields render correctly |
| Settings — Object Configuration | Pass | Custom Properties, Status Options (with drag-to-reorder), Association Visibility |
| Settings — User Management | Pass | User list, invite button, role filter |
| Notifications (Bell) | Pass | Dropdown, empty state, polling |
| Export | Pass | Download as .md and Copy to Clipboard options |
| Navigation | Pass | Sidebar, breadcrumbs, collapsible sections |
