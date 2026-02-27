# Ops Map — Implementation Plan

## Overview

This document contains the **active and future** implementation phases for Ops Map. Completed phases (MVP Phases 1-7 and Post-MVP Phases 2-2.6) are archived in `docs/completed-phases.md`.

**Tech Stack:**
- **Frontend:** Next.js 14+ (App Router) with TypeScript (strict mode)
- **Database:** PostgreSQL via Supabase (JSONB for custom properties, typed columns for standard)
- **Auth:** Supabase Auth
- **API:** Next.js Server Actions (internal), REST for future agent API
- **Real-time:** Supabase Realtime
- **Search:** PostgreSQL full-text search (pg_trgm + tsvector)
- **Markdown Editor:** TipTap
- **Drag-and-drop:** dnd-kit
- **Styling:** Tailwind CSS + shadcn/ui
- **File Storage:** Supabase Storage
- **Hosting:** Vercel (auto-deploys from main branch)

**Completed phases:** MVP Phases 1-7 (Foundation → Launch), Post-MVP 2-2.6 (Content, Import, Document View, Navigation, YAML Import, Import Skill), Phase 3.1 (Bug Fixes & Critical UX). See `docs/completed-phases.md` for full details.

---

## Post-MVP: Phase 3 — UI/UX Review & Refinement

*Based on product review session (Feb 25, 2026). This phase addresses all bug fixes, UX improvements, and missing features identified during hands-on product review. Must be completed before Phase 4 (AI Foundation).*

---

### Phase 3.1: Bug Fixes & Critical UX Issues ✅ COMPLETED

**Goal:** Fix broken functionality and bugs that prevent core workflows from working correctly.

**Completed:** PR #10 (commit `6bb996e`) + hotfix commit `278cbd6`. Dogfooded and verified on 2026-02-26.

#### 3.1.1 Text Field Editing — Missing `editable` Config ✅

- [x] Added `editable: true` to process columns: trigger, end_state, estimated_duration
- [x] Added `editable: true` to core_activity columns: trigger, end_state, video_url
- [x] Added description column entry to core_activity config
- [x] Audited ALL object configs — added editable to function, person, role, software, SOP, checklist, template fields
- [x] Added date type handler to EditableField component
- [x] Toast notifications already present for field saves

#### 3.1.2 Association Creation Issues ✅

- [x] Added try/catch + toast error notifications around addAssociation/removeAssociation
- [x] Associations re-fetch immediately after add/remove
- [x] Fixed "Create New" flow: auto-links newly created records for ALL association types (not just _children)
- [x] After auto-linking, re-fetches and displays the newly associated item

#### 3.1.3 Quick-Create Panel Button Visibility ✅

- [x] Made button row sticky with `sticky bottom-0`
- [x] Added shadow separator (`shadow-[0_-2px_4px_rgba(0,0,0,0.05)]`)
- [x] Added loading spinner on Create button during submission
- [x] Success/error toast notifications on create

#### 3.1.4 Subfunction Preview Panel Shows Raw UUID ✅

- [x] PreviewPanel resolves reference-type columns to human-readable titles
- [x] Resolved titles rendered as clickable links to referenced record's page
- [x] Applied to ALL reference fields (function_id, owner_person_id, etc.)
- [x] Missing references handled gracefully (shows "—")
- [x] **Hotfix (278cbd6):** Also added reference resolution to RecordView's renderFieldValue

#### 3.1.5 DataTable Title Column — Misleading Edit Affordance ✅

- [x] Title column (index 0) bypasses inline edit entirely
- [x] Shows link-style hover (underline, pointer cursor) instead of edit affordance
- [x] Titles only editable from record page, not list view

---

### Phase 3.2: Navigation & Header Improvements ✅ COMPLETED

**Goal:** Fix header layout, add personal account management, and enable workspace switching.

**Completed:** PR #11 (commit `2e0abc0`), merged to main on 2026-02-26.

#### 3.2.1 Header Right-Alignment ✅

- [x] Added `ml-auto` to the right-side items container to push it to the right edge of the header
- [x] Removed the empty Ops Coach placeholder div — will be re-added when Phase 4 implements the Ops Coach panel

#### 3.2.2 Personal Settings in Avatar Dropdown ✅

- [x] Expanded avatar dropdown with Profile, Security links, workspace section, and Sign out
- [x] Created `/settings/profile` page with: display name, email (read-only + change link), timezone select (all IANA timezones), location, profile photo upload
- [x] Created `/settings/security` page with: change password form, change email form (sends confirmation)
- [x] Created `profiles` table (id FK auth.users, display_name, timezone, location, avatar_url) with RLS policies
- [x] Created Supabase Storage `avatars` bucket with per-user folder RLS policies (5MB limit, image types only)
- [x] Top bar avatar shows uploaded profile photo via AvatarImage when available, falls back to initials
- [x] Settings index page includes Profile and Security cards
- [x] Profile auto-creates on first access

#### 3.2.3 Workspace Switching ✅

- [x] `getAuthContext()` now reads `ops-map-active-org` cookie to determine active workspace
- [x] Falls back to first org if cookie is missing or references an org user doesn't belong to
- [x] Avatar dropdown shows all workspaces with checkmark on active, plus "Create new workspace" option
- [x] Workspace switching sets cookie and refreshes page — all server actions automatically scope to new org
- [x] Create New Workspace dialog: creates organization + adds user as admin + switches
- [x] Invitation flow: existing `inviteUser` adds users to org, workspace appears in their switcher automatically

---

### Phase 3.3: Settings Page Improvements ✅ COMPLETED

**Goal:** Make settings more complete and useful for managing the platform.

**Completed:** Commit on 2026-02-26.

#### 3.3.1 Company Profile — Revenue Input Fix ✅

- [x] Fixed `$` prefix alignment using `top-1/2 -translate-y-1/2` for proper vertical centering
- [x] Added `pointer-events-none` and `text-sm` for consistent sizing

#### 3.3.2 User Management — Remove Button Clarity ✅

- [x] Replaced icon-only `UserMinus` button with ghost/destructive `Trash2` icon + "Remove" text label
- [x] Updated confirmation dialog text: "Are you sure you want to remove [email] from this workspace? They will lose access to all data in this workspace."
- [x] Confirmation dialog already had Cancel (default) and Remove (destructive) buttons

#### 3.3.3 Object Configuration — Show All Properties ✅

- [x] Redesigned "Custom Properties" tab to show ALL properties (default, custom, computed) for selected object type
- [x] Renamed tab from "Custom Properties" to "Properties"
- [x] Each property displays: name/label, type badge, origin badge (Default gray, Custom blue, Computed purple), required toggle
- [x] Custom properties: fully editable (rename, delete, required toggle)
- [x] Default properties: required toggle on/off
- [x] Critical fields (status): locked with tooltip "Status options are managed in the Status Options tab"
- [x] Computed fields (updated_at, created_at): lock icon with tooltip "This field is auto-calculated"
- [x] Drag-to-reorder ALL properties (default + custom) with drag handle
- [x] Order saved per-organization per-object-type via `property_order` org setting
- [x] Required settings saved per-organization per-object-type via `property_required` org setting
- [x] Admin-only: modifications and reorder. Members see read-only view
- [x] Added `getCurrentUserRole` server action for role check
- [x] Added SOP, Checklist, Template to the object type dropdown
- [x] Property order set here will be reflected on record pages (see 3.4.4)

**Acceptance criteria:**
- Admin opens Object Configuration for "Process", sees all fields (title, status, owner_person_id, owner_role_id, trigger, end_state, estimated_duration, updated_at, plus any custom properties)
- Admin can reorder fields and the new order persists
- Admin can toggle "required" on trigger field
- Admin cannot edit the status field options (locked) but can edit options on a custom select field
- Computed fields like updated_at show a lock icon

---

### Phase 3.4: Record Page Layout & Field Improvements ✅ COMPLETED

**Goal:** Improve record page layouts, add numbering, field organization, and missing fields/associations.

**Completed:** Commit on 2026-02-26.

#### 3.4.1 Process Record Page — Column Widths & Process Visual ✅

- [x] Changed RecordView grid layout for process pages to `grid-cols-[300px_1fr_280px]` (narrower left, wider middle)
- [x] Created `ProcessVisual` component with horizontal flow of numbered CA nodes, arrow connectors, drag-to-reorder via dnd-kit
- [x] Implemented numbering scheme: `{phase}.{process}.{ca}` (e.g., 1.1.1, 1.1.2) — positional, derived from sort order
- [x] Click-to-navigate: clicking a node navigates to the CA's record page
- [x] Add button (+) after last node to create new CAs inline
- [x] Process visual rendered in middle column above activity feed for process record pages only
- [x] Server action `getProcessWorkflowContext()` to fetch workflow numbering context for a process

#### 3.4.2 Core Activity Record Page — Heading, Description & Associations ✅

- [x] All record pages (RecordView + DocumentView) show object type badge (e.g., "Core Activity") next to title
- [x] Core activity record pages show positional number prefix (e.g., "1.1.3") if CA is in a workflow
- [x] `description` column already existed in core_activity config — moved above trigger/end_state for better ordering
- [x] Added reverse Processes association to core_activity config via `process_core_activities` junction table
- [x] Added computed Workflows section in associations panel — read-only list queried via `getCoreActivityWorkflows()` server action
- [x] Server actions: `getCoreActivityWorkflowContext()` and `getCoreActivityWorkflows()` in workflow.ts

#### 3.4.3 Three-Dot Menu — Add Custom Field Option ✅

- [x] Added "Add Custom Field" menu item in three-dot dropdown on RecordView (above Delete, with separator)
- [x] Added "Add Custom Field" menu item in three-dot dropdown on DocumentView (above Delete, with separator)
- [x] Clicking navigates to `/settings/objects?type={objectType}` with current type pre-selected
- [x] Settings objects page reads `type` query parameter and auto-selects on initial load

#### 3.4.4 Custom Properties — Mixed Arrangement with Defaults ✅

- [x] Removed separate `<CustomProperties>` component section from record pages
- [x] Custom properties now intermixed with default properties in a single unified list via `unifiedFields` useMemo
- [x] Display order respects `property_order` org setting (set in Object Configuration 3.3.3)
- [x] Fallback: if no custom order saved, default order from object-config.ts with custom props appended
- [x] Custom property editing inline with same UX as default property editing

#### 3.4.5 Core Activity ↔ Process Auto-Association ✅

- [x] `createCoreActivityInProcess()` already inserts into `process_core_activities` junction table (was already implemented)
- [x] Correct `position` set (appended to end of process's CA list)
- [x] Now reflected on CA's record page via the new Processes reverse association in config
- [x] Reflected on process's record page via both the Core Activities association and the ProcessVisual component

---

### Phase 3.5: Workflow & Function Chart Improvements -- COMPLETED

**Goal:** Add workflow status, enable cross-process drag, improve function chart UX.

#### 3.5.1 Workflow Status

**Requirements:**

- [x] Database migration: Add `status` column to `workflows` table — type `TEXT NOT NULL DEFAULT 'Draft'`, with CHECK constraint for values: `'Draft'`, `'Active'`, `'Archived'`
- [x] Update the workflow list page (`workflows/page.tsx`):
  - Add a "Status" column to the table showing a colored badge (Draft = gray, Active = green, Archived = yellow/muted)
  - Also show the status badge next to the workflow title in the same row for quick scanning
  - Add status as a filterable column (filter dropdown in the table header)
  - Add status as a sortable column
- [x] In the workflow builder view (`workflows/[id]/page.tsx`):
  - Show the current status as a badge in the page header
  - Allow changing status via a dropdown (same pattern as record page status fields)
  - Persist status change via server action (update the `workflows` row)
- [x] Update search to include workflow status in results

**Acceptance criteria:**
- Workflow list shows a status column with colored badges; user can filter by Draft/Active/Archived
- User can change a workflow's status from the builder page header
- New workflows default to "Draft"

---

#### 3.5.2 Cross-Process Core Activity Drag-and-Drop

**Root cause:** Each process in the workflow builder has its own isolated `DndContext` (workflow `[id]/page.tsx` line 950), so core activities can only be reordered within a single process. The function chart drill-down (`function-chart/[id]/page.tsx`) already implements cross-column drag with a shared top-level `DndContext` + `onDragOver` — use as reference.

**Requirements:**

- [x] Replace the per-process `DndContext` in the workflow builder with a single shared `DndContext` wrapping ALL processes within a phase (or all processes in the entire workflow)
- [x] Implement `onDragOver` handler: when a core activity is dragged over a different process container, visually move it to that container (optimistic local state update)
- [x] Implement `onDragEnd` handler to persist the cross-process move:
  - Delete the row from `process_core_activities` for the source process
  - Insert a new row in `process_core_activities` for the target process with the correct position
  - Update positions of remaining CAs in the source process (close the gap)
  - Update positions of CAs in the target process (make room at the drop position)
- [x] Show visual feedback during drag: highlight valid drop zones (other process containers), show an insertion line at the drop position
- [x] Handle edge case: if a CA is the only item in a process, the source process should show an empty state after the move

**Acceptance criteria:**
- User drags a core activity from Process 1.1 and drops it into Process 1.2 — the CA moves and the change persists after refresh
- Reordering within a single process still works as before
- Numbers update automatically after a cross-process move

---

#### 3.5.3 Function Chart — Cleaner Add Subfunction UI

**Requirements:**

- [x] Remove the two "Add Subfunction" ghost buttons that currently appear above and below each subfunction card in every function column (function-chart/page.tsx lines 289-305 and 339-355)
- [x] Add a single `+` button at the bottom of each function column, below the last subfunction card — clicking it creates a new subfunction at the bottom of that function's list
- [x] Add a small `+` icon in the function column header area (bottom-right corner of the header) — clicking it creates a new subfunction at the top of that function's list
- [x] Both buttons open the same `QuickCreatePanel` for subfunctions with `function_id` pre-set

**Acceptance criteria:**
- No "Add Subfunction" buttons floating between subfunction cards
- One `+` at the bottom of each column, one small `+` in the column header
- Function chart looks cleaner with less visual clutter

---

#### 3.5.4 Function Click — Chart Drill-Down Verification

**Requirements:**

- [x] Verify that clicking a function title in the function chart column header navigates to `/function-chart/[id]` (the drill-down chart view showing subfunctions as columns and core activities as cards) — this is already implemented, just confirm it works
- [x] Make the "View record" link in the function column header less prominent (smaller text, muted color) or rename it to "Edit properties" to clarify that it goes to the generic record page, not the chart
- [x] Add a breadcrumb at the top of the function chart drill-down page: "Function Chart > [Function Name]" with "Function Chart" linking back to `/function-chart`

**Acceptance criteria:**
- Primary click on function name goes to the chart drill-down
- User can easily navigate back to the full function chart from the drill-down

---

### Phase 3.6: Document View Improvements (SOP, Checklist, Template) ✅ COMPLETED

**Goal:** Refine document-type record pages for better field sizing, usability, and appropriate editing experiences.

**Completed:** Phase 3.6 implementation — 2 DB migrations, object config updates, new ChecklistItemsEditor component, refactored DocumentView with per-type field rendering, interactive StatusBadge dropdown.

#### 3.6.1 SOP Page Improvements ✅

**Root cause:** `trigger`, `end_state`, and `description` all render as full TipTap rich text editors. The status badge is display-only with no click handler.

**Requirements:**

- [x] Modify `DocumentView` to support per-field rendering overrides based on the object type:
  - For SOPs: render `trigger` and `end_state` as small plain text inputs (single line) instead of TipTap editors — remove them from the `CONTENT_FIELDS` array for SOP context
  - For SOPs: render `description` as a small textarea (2-3 rows, plain text or very basic formatting) instead of a full TipTap editor
  - For SOPs: keep `content` as the large TipTap rich editor — this is the main SOP body
- [x] Field display order on SOP page: Description (small) → Trigger (single line) → End State (single line) → Content (large editor)
- [x] Database migration: Add `video_url` TEXT column to the `sops` table
- [x] Add `video_url` to the SOP object config
- [x] Render the video URL field as a text input where the user pastes a URL (YouTube, Google Drive, or Loom)
- [x] Below the URL input, embed the video natively using an iframe:
  - YouTube: convert `youtube.com/watch?v=ID` or `youtu.be/ID` to `youtube.com/embed/ID`
  - Loom: convert `loom.com/share/ID` to `loom.com/embed/ID`
  - Google Drive: convert `drive.google.com/file/d/ID/view` to `drive.google.com/file/d/ID/preview`
  - If the URL doesn't match any known pattern, show the raw link
  - Reuse/extend the existing `VideoEmbed` component from the core activity record page
- [x] Make the `StatusBadge` in `DocumentMetaRow` interactive for ALL document types (SOP, Checklist, Template):
  - Clicking the status badge opens a dropdown with available status options (Draft, Published, Archived)
  - Selecting a new status immediately persists it via the `updateRecord` server action
  - Badge color updates to reflect the new status

**Acceptance criteria:**
- SOP page shows small fields for trigger/end state/description, a large editor for content, and a video embed section
- Pasting a YouTube/Loom/Google Drive URL shows an embedded playable video
- Clicking the "Published" badge opens a dropdown to change status

---

#### 3.6.2 Checklist Page Improvements ✅

**Requirements:**

- [x] Make the status badge clickable/toggleable (same as SOP — reuse the interactive StatusBadge from 3.6.1)
- [x] Render `description` as a small textarea (2-3 rows, plain text) instead of a full TipTap editor
- [x] Database migration: Add `trigger` TEXT and `end_state` TEXT columns to the `checklists` table
- [x] Add `trigger` and `end_state` to the checklist object config — render as small plain text inputs on the checklist page
- [x] Database migration: Add `items` JSONB column to the `checklists` table for structured checklist items (array of `{ text: string, position: number }`)
- [x] Redesign the `content` section as a **checklist items editor** (new component: `ChecklistItemsEditor`):
  - Each item is a single-line plain text input (no rich formatting)
  - Items are displayed as a numbered vertical list
  - Each item row has: a drag handle (left), the item number, the text input (fills remaining width), and a delete (X) button (right)
  - "Add item" button below the last item — clicking it adds a new empty item and focuses it
  - Drag-to-reorder items using dnd-kit (similar pattern to existing drag-reorder in the app)
  - **Soft limit of 10 items:** When items exceed 10, show a warning message below the list: "Checklists are recommended to be no longer than 10 items." The warning is informational — users CAN add more items.
  - **Smart paste:** When pasting multi-line text into any item input, detect line breaks and automatically split the pasted text into multiple separate items (one per line). If the resulting total exceeds 10, show the soft warning. All pasted items are added regardless of count.
  - Items are plain text only — no markdown, no bold, no links
  - Auto-save: items persist to the database (the `items` JSONB column) on blur or after reorder, debounced
- [x] Field display order on checklist page: Description (small) → Trigger (single line) → End State (single line) → Checklist Items (editor)
- [x] Migrate existing `content` data: if any checklists have freeform content, attempt to parse it into line-separated items during migration or show a one-time migration prompt

**Acceptance criteria:**
- Checklist page shows a clean, numbered list of items with add/delete/reorder
- Pasting 5 lines of text into one item creates 5 separate items
- Adding an 11th item shows the soft warning but is allowed
- Pasting 15 lines creates 15 items with the soft warning shown
- Items are strictly plain text

---

#### 3.6.3 Template Page Improvements ✅

**Requirements:**

- [x] Reorder fields on the template page: `description` appears above `content`
- [x] Render `description` as a small plain textarea (2-3 rows) instead of a full TipTap editor
- [x] Label the main content section with a visible heading: "Template Content"
- [x] Keep the `content` field as a full TipTap rich editor

**Acceptance criteria:**
- Template page shows: Description (small) → "Template Content" heading → large TipTap editor
- Description is a simple text field, not a rich editor

---

### Phase 3.7: Object Schema Additions

**Goal:** Add missing fields to Role and Person objects identified during product review.

#### 3.7.1 Role — Additional Fields

**Requirements:**

- [ ] Database migration: Add `salary_range_min` INTEGER and `salary_range_max` INTEGER columns to the `roles` table
- [ ] Database migration: Add `other_function_ids` JSONB column to the `roles` table (array of UUID strings referencing functions)
- [ ] Update role object config in `object-config.ts`:
  - Add `salary_range_min` and `salary_range_max` as number fields, editable, visible on record page. Render as two side-by-side inputs with labels "Min" and "Max" and a `$` prefix on each
  - Add `other_functions` as a new field type: multi-select reference to functions. Render as a list of selected functions with an "Add" button that opens a `ReferenceCombobox` to search and select additional functions. Each selected function shows with an X to remove.
  - Ensure `brief_description` has `visible: true` (or remove `visible: false`) so it shows on the record page and in the DataTable
- [ ] The multi-select reference field type (`other_functions`) should be a reusable pattern — it will likely be needed for other objects in future phases

**Acceptance criteria:**
- Role record page shows: Primary Function (single select), Other Functions (multi-select showing tags for each selected function), Brief Description (editable text), Salary Range (two number inputs showing $min – $max)
- Admin can add/remove functions from the "Other Functions" list
- Brief description is visible in both the list view and the record view

---

#### 3.7.2 Person — Additional Fields

**Requirements:**

- [ ] Database migration: Create a `benefit_options` table (id, organization_id, label, created_by, created_at) to store the organization's available benefit tags
- [ ] Database migration: Create a `person_benefits` junction table (person_id, benefit_option_id, created_by, created_at) linking people to their selected benefits
- [ ] Update person object config:
  - Add "Benefits" as an association-style field on the person record page
  - Render as a list of tags (pills/badges) showing each selected benefit
  - "Add" button opens a combobox showing existing benefit options for the organization, with a "Create new" option to define a new benefit tag on the fly
  - Tags can be removed with an X button
- [ ] Seed some default benefit options for new organizations: "Health Insurance", "Dental", "Vision", "401(k)", "PTO", "Remote Work Stipend" — these are suggestions that can be deleted or renamed
- [ ] The benefit tags system should be per-organization (each workspace manages its own benefit options)

**Acceptance criteria:**
- Person record page shows a "Benefits" section with tags like "Health Insurance", "Dental", "401(k)"
- Admin can add new benefit options (e.g., "Gym Membership") and they become available for all people in the organization
- Multiple people can share the same benefit tags

---

### Phase 3.8: Tools Page Redesign ✅ COMPLETED

**Goal:** Make the Tools page scalable for multiple tools with proper navigation.

**Completed:** Redesigned tools as index/grid + detail pages with breadcrumb navigation.

#### 3.8.1 Tools Index Page ✅

- [x] Redesigned `/tools` as an index/grid page showing one card per tool
- [x] Each tool card shows: icon (Terminal), tool name, brief 1-sentence description, and "View details" link
- [x] Grid layout accommodates 2-4 cards per row (responsive: 1/2/3/4 columns)
- [x] Clicking a card navigates to `/tools/ops-import-skill`

#### 3.8.2 Tool Detail Pages with Breadcrumb ✅

- [x] Created `/tools/ops-import-skill/page.tsx` with all Ops Import Skill content moved from `/tools/page.tsx`
- [x] Added breadcrumb navigation via PageHeader backHref: "Tools" arrow link back to `/tools`
- [x] All existing detail content preserved (description, what it does, installation steps, individual file downloads)
- [x] Route structure `/tools/[slug]` is flexible for adding more tools later

---

### Phase 3 — Implementation Order

Recommended execution order based on dependencies and impact:

| Priority | Phase | Description | Effort |
|----------|-------|-------------|--------|
| 1 | 3.1.1 | Text field editing config fix | XS |
| 2 | 3.1.2 | Association creation fix | S |
| 3 | 3.1.3 | Quick-create button visibility | XS |
| 4 | 3.1.4 | Preview panel reference resolution | S |
| 5 | 3.1.5 | DataTable title column fix | XS |
| 6 | 3.2.1 | Header right-alignment | XS |
| 7 | 3.5.1 | Workflow status (migration + UI) | S |
| 8 | 3.4.2 | Core activity heading, description, associations | S |
| 9 | 3.4.1 | Process record page layout + process visual + numbering | L |
| 10 | 3.6.1 | SOP page improvements (field sizes + video embed + status toggle) | M |
| 11 | 3.6.2 | Checklist page improvements (items editor + smart paste) | L |
| 12 | 3.6.3 | Template page improvements | XS |
| 13 | 3.5.3 | Function chart cleaner add-subfunction UI | S |
| 14 | 3.5.4 | Function chart drill-down verification + breadcrumb | XS |
| 15 | 3.4.5 | Core activity ↔ process auto-association | S |
| 16 | 3.5.2 | Cross-process drag-and-drop | L |
| 17 | 3.3.1 | Revenue input fix | XS |
| 18 | 3.3.2 | Remove user button clarity | XS |
| 19 | 3.3.3 | Object configuration — show all properties | L |
| 20 | 3.4.3 | Three-dot menu custom field option | XS |
| 21 | 3.4.4 | Custom properties mixed arrangement | M |
| 22 | 3.7.1 | Role additional fields (other functions, salary range) | M |
| 23 | 3.7.2 | Person benefits tags | M |
| 24 | 3.8 | Tools page redesign | S |
| 25 | 3.2.2 | Personal settings (profile + security pages) | M |
| 26 | 3.2.3 | Workspace switching | XL |

*Effort key: XS = < 1 hour, S = 1-3 hours, M = 3-8 hours, L = 1-2 days, XL = 3-5 days*

---

### Phase 3 — Database Migrations Required

1. `add_workflow_status` — Add `status TEXT NOT NULL DEFAULT 'Draft'` + CHECK constraint to `workflows` table
2. `add_checklist_trigger_endstate` — Add `trigger TEXT`, `end_state TEXT` to `checklists` table
3. `add_checklist_items` — Add `items JSONB` to `checklists` table (array of `{text, position}`)
4. `add_sop_video_url` — Add `video_url TEXT` to `sops` table
5. `add_role_fields` — Add `salary_range_min INTEGER`, `salary_range_max INTEGER`, `other_function_ids JSONB` to `roles` table
6. `add_benefit_options` — Create `benefit_options` table (id, organization_id, label, created_by, created_at) + `person_benefits` junction table
7. `add_user_profiles` — Create `profiles` table or extend auth metadata for display_name, timezone, location, avatar_url (if not using Supabase Auth metadata)
8. `add_property_order` — Add storage for per-org property display order (could be a `property_orders` table or a JSONB column on the `organizations` table)

**No migration needed for:**
- Core activity `description` — column already exists in DB (`core_activities.description TEXT`), just needs to be added to the object config
- Core activity ↔ Process association — junction table `process_core_activities` already exists, just needs reverse association defined in core_activity config

### Phase 3 — Config-Only Changes (No Migration)

These items only require changes to `src/lib/object-config.ts`:
1. Add `editable: true` to trigger, end_state, estimated_duration on process columns
2. Add `editable: true` to trigger, end_state, video_url on core_activity columns
3. Add `description` column entry to core_activity config
4. Add reverse `process` association to core_activity config (using existing `process_core_activities` junction table)
5. Change `brief_description` to `visible: true` on role config

---

## Post-MVP: Phase 4 — AI Foundation

### Goal
Introduce the Ops Coach and AI-assisted content creation.

### Strict Requirements

#### P4.1 Ops Coach — Basic
- [ ] Slide-out panel from right side (icon in top bar activates)
- [ ] Chat interface: text input + message history
- [ ] Voice input via speech-to-text (OpenAI Whisper API or equivalent)
- [ ] Context-aware: detects current page/record/map and includes in AI prompt
- [ ] Proactive follow-up questions (up to 3 per interaction)
- [ ] Capabilities:
  - Draft SOP from Core Activity context
  - Draft Checklist from Core Activity context
  - Suggest description, trigger, end state for Core Activities
  - Answer questions using company profile and system data

#### P4.2 AI Content Labeling
- [ ] All AI-generated content visually labeled with AI badge/icon
- [ ] Label persists until human reviews and confirms (explicit "Approve" action)
- [ ] Approval removes AI label
- [ ] AI-generated vs. human-created distinction tracked in database

#### P4.3 Voice Input
- [ ] Microphone icon on all markdown fields
- [ ] Record → speech-to-text → AI cleanup pass → user reviews
- [ ] Available in Ops Coach panel

### Acceptance Criteria
- Ops Coach panel opens/closes, accepts text and voice input
- AI generates contextually relevant content (SOP drafts, property suggestions)
- AI content is labeled and can be approved/rejected
- Voice input transcribes and populates fields correctly

---

## Post-MVP: Phase 5 — Org & Metrics

### Strict Requirements
- [ ] Team object with full CRUD, views, and associations
- [ ] KPI object (reference records only — define what to measure)
- [ ] Feature object with parent Software relationship
- [ ] Org Chart map view with Singular/Comprehensive/People toggles
- [ ] Phase 5b: KPI actual value tracking, trend charts, Scorecards view
- [ ] Dashboard enhancements: People Spend, enhanced Software Spend
- [ ] Navigation updates: Team under People, KPIs nav group, Features under Resources, Org Chart under People

---

## Post-MVP: Phase 6 — External & Equipment

### Strict Requirements
- [ ] Vendor object with full CRUD, views, and associations
- [ ] Subcontractor object with full CRUD, views, and associations
- [ ] Equipment object with full CRUD, views, and associations
- [ ] PDF export for maps (Workflow Map → portrait, Function Chart → landscape)
- [ ] Navigation updates: Vendors, Subcontractors under People; Equipment under Resources

---

## Post-MVP: Phase 7 — Advanced AI

### Strict Requirements
- [ ] AI-Powered Onboarding Wizard (multi-step guided setup, auto-populates draft data)
- [ ] Voice-to-Workflow (Ops Coach dedicated page, record voice → AI generates Workflow)
- [ ] AI Gap Analysis (identifies missing CAs, undocumented processes, etc.)
- [ ] Dashboard: Questions to Answer (AI-identified gaps as clickable questions)
- [ ] Software Feature Auto-Detection (Ops Coach fetches feature lists)
- [ ] Mind Sweep (exploratory — AI trigger list, voice input, constraint mapping)
- [ ] Ops Coach Dedicated Page (full-page workspace for long sessions)
- [ ] Proactive AI (Ops Coach surfaces observations without being asked)

---

## Post-MVP: Phase 8 — Agent Platform

### Strict Requirements
- [ ] Public Agent API (REST, JSON with markdown content fields)
  - Read: query any object, workflow, function chart, associations
  - Write: create records, update properties, modify associations, change statuses
  - Authentication: API keys with scoped permissions
  - Rate limiting and audit logging
  - API documentation
- [ ] CLI tool for command-line interaction with Ops Map
- [ ] Real-time Agent Access: webhook support for events
- [ ] Checklist Manager App (separate interface for interactive checklist completion)

---

## Cross-Cutting Concerns (All Phases)

### Security
- RLS on all tables, all queries scoped to organization
- Input sanitization on all user inputs (XSS prevention)
- CSRF protection on all mutations
- Rate limiting on auth endpoints
- No secrets in client-side code
- Markdown rendering sanitized (no script injection)

### Testing
- Integration tests for all API endpoints / server actions
- Component tests for reusable view components (List View, Record View, Preview Panel, Quick-Create)
- E2E tests for critical flows: signup → create Function → create Subfunction → create CA → view on Function Chart

### Data Integrity
- All foreign key constraints enforced at database level
- Cascade deletes configured correctly (deleting a Function cascades to its Subfunctions, etc.)
- Orphan prevention: Core Activity cannot have a non-existent Subfunction reference
- Concurrent edit handling: last-write-wins with `updated_at` conflict detection

### Performance
- Database indexes on all foreign keys and commonly filtered columns
- Connection pooling configured
- Static assets cached and served via CDN (Vercel)
- Server-side rendering for initial page loads
- Client-side data fetching with SWR or React Query for dynamic data
