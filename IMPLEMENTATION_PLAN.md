# Ops Map — Implementation Plan

## Overview

This document defines the phased implementation plan for Ops Map. The MVP is broken into 7 development phases, each with strict requirements that must be fully met before proceeding to the next phase. Post-MVP phases (2-7 from the Product Roadmap) follow with their own requirements.

**Tech Stack Decision Points** (to be resolved before Phase 1 begins):
- **Frontend:** Next.js 14+ (App Router) with TypeScript
- **Database:** PostgreSQL via Supabase (JSONB for custom properties, typed columns for standard properties)
- **Auth:** Supabase Auth
- **API:** tRPC or Next.js Server Actions (internal), REST for future agent API
- **Real-time:** Supabase Realtime (WebSocket-based) for cross-view updates
- **Search:** PostgreSQL full-text search (pg_trgm + tsvector) for MVP; evaluate Elasticsearch post-MVP if needed
- **Markdown:** TipTap or Milkdown editor for rich markdown editing
- **Drag-and-drop:** dnd-kit
- **Styling:** Tailwind CSS + shadcn/ui component library
- **File Storage:** Supabase Storage (profile photos)
- **Hosting:** Vercel

---

## MVP Phase 1: Foundation & Infrastructure

### Goal
Establish the project skeleton, database schema, authentication, and API patterns that all subsequent phases build on. No UI beyond auth screens.

### Strict Requirements

#### 1.1 Project Setup
- [ ] Next.js 14+ App Router project with TypeScript (strict mode)
- [ ] Tailwind CSS + shadcn/ui installed and configured
- [ ] ESLint + Prettier configured with consistent rules
- [ ] Supabase project created and connected
- [ ] Environment variables configured (.env.local, never committed)
- [ ] Git repository initialized with .gitignore covering all sensitive files
- [ ] Folder structure established:
  ```
  src/
    app/           # Next.js routes
    components/    # Shared UI components
    lib/           # Utilities, DB client, API helpers
    types/         # TypeScript type definitions
    hooks/         # Custom React hooks
    server/        # Server-side logic (API routes, actions)
  ```

#### 1.2 Database Schema — Core Tables
All 7 MVP object tables must be created with their standard typed columns. Every table must include:
- [ ] `id` (UUID, primary key, auto-generated)
- [ ] `title` (text, not null) — or `first_name`/`last_name` for Person
- [ ] `description` (text, nullable) — stored as markdown string
- [ ] `status` (text, not null, with CHECK constraint for valid values)
- [ ] `created_at` (timestamptz, default now())
- [ ] `updated_at` (timestamptz, default now(), auto-updated via trigger)
- [ ] `created_by` (UUID, FK to auth.users)
- [ ] `updated_by` (UUID, FK to auth.users)
- [ ] `organization_id` (UUID, FK to organizations — multi-tenancy from day 1)

**Object-specific columns** (all typed columns per the MVP Specification):

- [ ] **functions** — `owner_id` (FK to persons)
- [ ] **subfunctions** — `owner_id`, `function_id` (FK to functions, NOT NULL)
- [ ] **processes** — `owner_person_id`, `owner_role_id`, `trigger`, `end_state`, `estimated_duration`, `last_revised`
- [ ] **core_activities** — `trigger`, `end_state`, `video_url`, `subfunction_id` (FK to subfunctions, nullable — required for Active status only)
- [ ] **persons** — `first_name`, `last_name`, `email`, `mobile_phone`, `work_phone`, `personal_phone`, `job_title`, `primary_role_id`, `primary_function_id`, `manager_id` (self-ref FK), `start_date`, `salary`, `location`, `work_arrangement`, `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relationship`, `profile_photo_url`
- [ ] **roles** — `brief_description`, `job_description`, `primary_function_id`
- [ ] **software** — `category` (text[] array for multi-select), `url`, `monthly_cost`, `annual_cost`, `pricing_model`, `number_of_seats`, `current_discount`, `renewal_date`, `billing_cycle`

#### 1.3 Database Schema — Junction Tables (Associations)
Every M:M association from the Association Map must have a junction table:
- [ ] `function_roles`, `function_people`, `function_software`, `function_workflows`
- [ ] `subfunction_roles`, `subfunction_people`, `subfunction_software`, `subfunction_processes`
- [ ] `process_core_activities` (with `position` integer for ordering)
- [ ] `process_subfunctions`, `process_roles_involved`, `process_people_involved`, `process_software`
- [ ] `core_activity_roles`, `core_activity_people`, `core_activity_software`
- [ ] `role_people`, `role_subfunctions`
- [ ] `software_people`, `software_roles`
- [ ] All junction tables must have: composite primary key, `created_at`, `created_by`, and appropriate indexes
- [ ] Foreign key constraints with CASCADE on delete for junction tables

#### 1.4 Database Schema — Supporting Tables
- [ ] **organizations** — `id`, `name`, `industry`, `revenue`, `location`, `key_objectives`, `company_description`, `biggest_pains`, `created_at`
- [ ] **workflows** — `id`, `title`, `description`, `organization_id`, `created_at`, `updated_at`, `created_by`, `updated_by`
- [ ] **workflow_phases** — `id`, `workflow_id`, `title`, `description`, `position` (integer for ordering), `status`
- [ ] **workflow_phase_processes** — `phase_id`, `process_id`, `position` (ordering within phase)
- [ ] **handoff_blocks** — `id`, `workflow_id`, `label`, `from_phase_id`, `to_phase_id`, `position`
- [ ] **custom_properties** — `id`, `organization_id`, `object_type` (enum), `property_name`, `property_type` (text/number/date/select/multi_select/url/email/phone/currency/boolean), `options` (JSONB, for select/multi-select), `position` (display order), `created_at`
- [ ] **custom_property_values** — `id`, `custom_property_id`, `record_id` (UUID), `record_type` (enum matching object_type), `value` (JSONB), `created_at`, `updated_at`
- [ ] **activity_log** — `id`, `organization_id`, `record_id`, `record_type`, `action` (created/updated/status_changed/association_added/association_removed/comment), `field_name`, `old_value` (JSONB), `new_value` (JSONB), `comment_text`, `user_id`, `created_at`

#### 1.5 Database — Row Level Security (RLS)
- [ ] RLS enabled on ALL tables
- [ ] Policies ensuring users can only access data within their organization
- [ ] Service role key used only for server-side operations
- [ ] Anon key used only for auth flows

#### 1.6 Database — Triggers & Functions
- [ ] `updated_at` auto-update trigger on all object tables
- [ ] Auto-calculated field functions:
  - Function: `number_of_subfunctions`, `number_of_core_activities`, `number_of_active_core_activities`, `number_of_draft_core_activities`, `number_of_people`, `software_spend`, `people_spend`
  - Subfunction: same pattern for its calculated fields
  - Process: `documented` boolean (all CAs active), count fields
  - Person: `tenure` (years from start_date)
  - Role: `number_of_people`, `last_hired`
  - Software: `total_current_cost`
- [ ] These can be computed columns, database views, or application-level computed fields — but must be consistent and accurate

#### 1.7 Authentication
- [ ] Supabase Auth configured with email/password signup and login
- [ ] Login page with email + password
- [ ] Signup page with email + password + organization name (creates org + user)
- [ ] Password reset flow (email-based)
- [ ] Session management with automatic refresh
- [ ] Protected routes — all app routes require authentication
- [ ] User linked to organization via `user_organizations` junction table
- [ ] Two roles: `admin` and `member` (stored in junction table)
- [ ] Auth middleware that injects `organization_id` into all queries

#### 1.8 API Layer Foundation
- [ ] Server Actions or tRPC routes established for CRUD on all 7 objects
- [ ] Input validation using Zod schemas matching database constraints
- [ ] Error handling pattern: consistent error response format
- [ ] All mutations log to `activity_log` table
- [ ] Pagination pattern established (cursor-based preferred)
- [ ] API responses include computed/calculated fields

### Acceptance Criteria for Phase 1
- All tables exist with correct schemas, constraints, and indexes
- RLS policies pass security tests (user A cannot access org B data)
- Auth flows work end-to-end (signup, login, logout, password reset)
- CRUD operations work for all 7 objects via API (tested via integration tests or Supabase dashboard)
- Activity log entries are created for all mutations
- Custom property values can be stored and retrieved for any object
- Junction table associations can be created and queried
- Calculated fields return correct values

---

## MVP Phase 2: Layout Shell & Navigation

### Goal
Build the app shell, navigation structure, and routing so all subsequent UI work has a home.

### Strict Requirements

#### 2.1 App Layout Shell
- [ ] Persistent top bar across all authenticated pages
- [ ] Persistent left sidebar (collapsible)
- [ ] Main content area that fills remaining space
- [ ] Responsive behavior: sidebar collapses to icon-only on smaller screens

#### 2.2 Top Bar
- [ ] App logo (left) — clicks to navigate to Dashboard (`/`)
- [ ] Global Search input (center-left) — placeholder only in this phase, functional in Phase 6
- [ ] "Create New" button with dropdown menu listing all 7 object types — clicking one opens Quick-Create Panel (built in Phase 3)
- [ ] Notifications icon (placeholder, non-functional for MVP)
- [ ] Settings gear icon — navigates to `/settings`
- [ ] Profile avatar (right) — dropdown with: user name/email, logout button
- [ ] Reserved space for Ops Coach icon (empty slot, no functionality)

#### 2.3 Left Sidebar
- [ ] Collapsible with smooth animation
- [ ] Icon-only mode when collapsed; full labels when expanded
- [ ] Hover to temporarily expand when collapsed
- [ ] Navigation groups with correct icons:
  - **Home** — `/` (Dashboard)
  - **Workflows** — `/workflows` (All Workflows), `/processes` (Processes)
  - **Functions** — `/function-chart` (Function Chart), `/functions` (Functions), `/subfunctions` (Subfunctions)
  - **Core Activities** — `/core-activities`
  - **People** — `/people` (People), `/roles` (Roles)
  - **Resources** — `/software` (Software)
- [ ] Active state highlighting for current route
- [ ] Groups are expandable/collapsible
- [ ] Sidebar state (expanded/collapsed) persisted in localStorage

#### 2.4 Routing
- [ ] All routes defined with Next.js App Router
- [ ] Route structure:
  ```
  /                          → Dashboard
  /function-chart            → Function Chart (top-level)
  /function-chart/[id]       → Function Chart (drill-down)
  /workflows                 → All Workflows list
  /workflows/[id]            → Workflow Map
  /functions                 → Functions list
  /functions/[id]            → Function record
  /subfunctions              → Subfunctions list
  /subfunctions/[id]         → Subfunction record
  /processes                 → Processes list
  /processes/[id]            → Process record
  /core-activities           → Core Activities list
  /core-activities/[id]      → Core Activity record
  /people                    → People list
  /people/[id]               → Person record
  /roles                     → Roles list
  /roles/[id]                → Role record
  /software                  → Software list
  /software/[id]             → Software record
  /settings                  → Settings
  /settings/company          → Company Profile
  /settings/objects          → Object Configuration
  /settings/users            → User Management
  ```
- [ ] 404 page for unknown routes
- [ ] Loading states for all route transitions

#### 2.5 Back Navigation
- [ ] Every record page shows a back link to its parent list view (e.g., Core Activity record → "Core Activities" link)
- [ ] Function Detail View shows back link to Function Chart top-level
- [ ] Workflow Map shows back link to All Workflows list
- [ ] Browser back button works correctly for all navigation paths
- [ ] No breadcrumbs (explicit design decision)

### Acceptance Criteria for Phase 2
- App shell renders with top bar, sidebar, and content area on all authenticated routes
- Sidebar collapses/expands with animation and persists state
- All routes resolve to placeholder pages (can show "Coming Soon" or object type name)
- Navigation highlights the active route correctly
- Back links are present and functional on all record-level routes
- Create New dropdown lists all 7 object types
- Logout works from profile avatar dropdown
- Layout is responsive — sidebar collapses on narrow viewports

---

## MVP Phase 3: Reusable View Components

### Goal
Build the 4 generic, reusable view components that every object uses. These are the workhorses of the app.

### Strict Requirements

#### 3.1 List View Component
A generic, configurable table component used by all 7 objects.

- [ ] Accepts configuration: columns (property name, label, type, sortable, filterable, editable), data source, create action
- [ ] Column headers with sort indicators (ascending/descending toggle)
- [ ] Sort by any column
- [ ] Filter by any property or association:
  - Text fields: contains/equals filter
  - Select fields: dropdown filter
  - Reference fields: dropdown with search (e.g., filter Core Activities by Software)
  - Status: multi-select filter
  - Date: range filter
- [ ] Search within the list (searches across all visible columns)
- [ ] Column customization: show/hide columns via a column picker dropdown
- [ ] "Create New" button in list header — opens Quick-Create Panel
- [ ] Click row title → navigates to full record page
- [ ] **Inline editing** on supported field types:
  - Select/dropdown fields (Status, Role, Software, Pricing Model, etc.) — click cell → dropdown
  - Reference fields (Person, Role, Function, etc.) — click cell → searchable dropdown
  - Simple text fields — click cell → text input
  - Phone/email fields — click cell → formatted input with validation
  - Markdown fields — NOT inline editable (must open full record)
  - Currency/number fields — click cell → number input
- [ ] Pagination (infinite scroll or page-based with page size selector)
- [ ] Empty state: "No [Object Type] found. Create your first one." with create button
- [ ] Loading skeleton while data fetches
- [ ] Row count displayed (e.g., "24 Core Activities")
- [ ] Filtered count shown when filters are active (e.g., "8 of 24 Core Activities")

#### 3.2 Record View Component (Three-Column)
A generic, configurable record page layout used by all 7 objects.

- [ ] Three-column layout: Left (properties) | Middle (activity feed) | Right (associations)
- [ ] **Left column — Properties:**
  - Renders typed fields based on object schema
  - Each field editable inline (click to edit, blur/enter to save)
  - Field types supported: text, markdown (opens mini-editor), number, currency, date, select, multi-select, email, phone, URL, image upload, person/role/function reference (searchable dropdown)
  - Markdown fields render as formatted text with an "Edit" button that opens inline editor
  - Video URL field renders an embedded player (supports YouTube, Vimeo, Loom, Google Drive URLs)
  - Status field rendered as a colored badge with dropdown to change
  - Auto-calculated fields rendered as read-only with distinct styling
  - Custom properties section at the bottom (renders dynamically based on custom_properties config)
- [ ] **Middle column — Activity Feed:**
  - Chronological list of activity log entries for this record
  - Entry types: created, property updated (shows old → new value), status changed, association added, association removed, comment
  - Each entry shows: user avatar/name, action description, timestamp (relative, with full date on hover)
  - Comment input at top: text area + submit button
  - Comments saved to activity_log with `action = 'comment'`
  - Infinite scroll or "Load more" for long histories
- [ ] **Right column — Associations:**
  - Sections for each association type (configured per object)
  - Each section: header with count, collapsible
  - Count links to filtered list view (e.g., "34 Core Activities" → `/core-activities?role=[id]`)
  - Items in each section are clickable → opens Preview Panel
  - "Add" button on each section → searchable dropdown to add existing record OR "Create New" option that opens Quick-Create Panel
  - "Remove" action (X button) on each associated item
  - Ordered associations (e.g., Process → Core Activities) show position and support drag-to-reorder
  - Sections can be collapsed/expanded; state persisted per user
- [ ] Export button (top right) — placeholder in this phase, functional in Phase 6
- [ ] Back link (top left) to parent list view
- [ ] Delete action (with confirmation dialog) accessible from a "more actions" menu

#### 3.3 Preview Panel Component
A universal overlay that slides in from the right.

- [ ] Triggered by clicking any linked record from a map view, list view, or association column
- [ ] Slides in from right edge with smooth animation
- [ ] Width: ~400px (does not take over full screen)
- [ ] Content layout (single column, scrollable):
  1. "Open Full Record" link at top
  2. Close button (X) at top right
  3. Properties section (key fields, editable inline)
  4. Associations section (condensed, clickable)
  5. Recent activity (last 5 entries, condensed)
- [ ] Clicking an association within the Preview Panel replaces the panel content with that record's preview
- [ ] Close button returns to previous view (the panel animates out)
- [ ] Clicking outside the panel closes it
- [ ] Escape key closes the panel
- [ ] Edits made in the Preview Panel save immediately and reflect in the underlying view

#### 3.4 Quick-Create Panel Component
A universal overlay for creating new records.

- [ ] Triggered by: "Create New" from top bar dropdown, "Create New" from list view, "Create New" from association column
- [ ] Slides in from right edge (same animation as Preview Panel)
- [ ] Title: "Create [Object Type]"
- [ ] Essential fields only (configured per object type):
  - **Function:** Title
  - **Subfunction:** Title, Parent Function (required, dropdown)
  - **Process:** Title, Trigger, End State
  - **Core Activity:** Title (must start with action verb — validated)
  - **Person:** First Name, Last Name, Job Title, Email, Primary Role (dropdown, with inline create), Primary Function (dropdown, NO inline create — info tooltip: "Functions should be set intentionally. Manage them in the Function Chart.")
  - **Role:** Title, Primary Function (dropdown)
  - **Software:** Title, Category (multi-select)
- [ ] Status defaults to Draft for operational objects, Active for Person
- [ ] Two buttons at bottom:
  - **Create** — saves record, navigates to full record page
  - **Create and Add Another** — saves record, clears form, stays in current view with panel open
- [ ] Validation errors shown inline next to fields
- [ ] Context-aware: when creating from an association column, auto-populates the relevant reference (e.g., creating a Core Activity from a Subfunction's association column auto-sets the Subfunction)

### Acceptance Criteria for Phase 3
- List View renders correctly for all 7 object types with proper columns
- Sorting, filtering, and search work on list views
- Inline editing on list views saves correctly and reflects immediately
- Record View renders the three-column layout with all property types
- Activity feed shows accurate history for a record
- Comments can be added and appear in the feed
- Associations can be added, removed, and reordered (where applicable)
- Preview Panel opens, displays record data, and allows inline editing
- Quick-Create Panel creates records with validation and both button actions work
- Clicking association counts navigates to filtered list views
- All components handle empty states and loading states

---

## MVP Phase 4: Function Chart

### Goal
Build both views of the Function Chart map — the primary organizational visualization.

### Strict Requirements

#### 4.1 Function Chart — Top-Level View (`/function-chart`)
- [ ] Functions displayed as large vertical block columns arranged horizontally
- [ ] Horizontal scrolling when Functions exceed viewport width
- [ ] Each Function block has:
  - Header showing Function title (clickable → drill-down to Function Detail View)
  - Function title also clickable to open Function record page
  - Subfunction cards stacked vertically inside the block (like HubSpot deal cards)
- [ ] Each Subfunction card shows:
  - Subfunction title
  - Status color indicator
  - People avatars (when toggle is on)
  - Software icons (when toggle is on)
  - Role tags (when toggle is on)
- [ ] **Toggle controls at top of view:**
  - People toggle (show/hide avatars on Subfunction cards)
  - Software toggle (show/hide icons)
  - Roles toggle (show/hide tags)
  - Multiple toggles can be active simultaneously
  - Toggle state persisted per user
- [ ] **Sort control:** Reorder Functions — Alphabetical A→Z, Z→A, or Custom (drag) order
- [ ] **Hover behaviors:**
  - Hover on Function block header → tooltip showing Function description
  - Hover on Subfunction card → tooltip showing Subfunction description
- [ ] **Click behaviors:**
  - Click Function block header → navigate to Function Detail View (`/function-chart/[id]`)
  - Click Function title text → navigate to Function record page (`/functions/[id]`)
  - Click Subfunction card → open Preview Panel
- [ ] **Create actions:**
  - "+" button at end of row → creates new Function (Quick-Create Panel)
  - "+" button at top and bottom of each Function block → creates new Subfunction (auto-sets parent Function)
- [ ] **Drag-and-drop:**
  - Drag Subfunction cards to reorder within a Function block
  - Drag position saves automatically
- [ ] **Inline tagging on hover:**
  - Hovering a Subfunction card shows an "Add Associations" action button
  - Clicking it opens a compact panel to tag People, Roles, Software without opening full record
- [ ] Status color coding on Subfunction cards matches the operational lifecycle colors

#### 4.2 Function Chart — Function Detail View (`/function-chart/[id]`)
- [ ] Same visual pattern as top-level but scoped to a single Function
- [ ] Function name displayed as page title
- [ ] Subfunctions displayed as vertical columns (side by side)
- [ ] Core Activities listed under each Subfunction column as items
- [ ] Each Core Activity item shows:
  - Title
  - Status color indicator
  - People avatars (when toggle on)
  - Software icons (when toggle on)
  - Role tags (when toggle on)
- [ ] **Toggle controls at top:** Same as top-level (People, Software, Roles)
- [ ] **Filter controls:**
  - Filter by Software (dropdown) → shows only CAs using that software
  - Filter by Person (dropdown) → shows only CAs tagged with that person
  - Filter by Role (dropdown) → shows only CAs tagged with that role
  - Filters apply across all Subfunction columns
  - Active filters shown as chips with clear button
- [ ] **Hover:** Core Activity → tooltip with description
- [ ] **Click:**
  - Click Core Activity → Preview Panel
  - Click Core Activity title → navigate to Core Activity record page
- [ ] **Create actions:**
  - "+" at top/bottom of each Subfunction column → create new Core Activity (auto-sets Subfunction)
- [ ] **Drag-and-drop:**
  - Reorder Core Activities within a Subfunction column
  - Move Core Activities between Subfunction columns (changes their primary Subfunction)
- [ ] Back link → returns to Function Chart top-level view
- [ ] Visual placeholder in empty Subfunction columns: "Add Core Activities to this Subfunction"

### Acceptance Criteria for Phase 4
- Top-level Function Chart renders all Functions as blocks with Subfunction cards
- Toggles show/hide People, Software, Roles on cards and persist state
- Sort control reorders Functions (alpha and custom drag)
- Drill-down view shows single Function with Subfunction columns and Core Activities
- Filter controls work correctly and filter across all columns
- Drag-and-drop reorders items and moving CAs between Subfunctions updates the parent
- All hover tooltips display descriptions
- Preview Panel opens on card/item click
- Create actions open Quick-Create with correct context
- Inline tagging on hover works for Subfunction cards
- Status colors match operational lifecycle
- Back navigation works correctly

---

## MVP Phase 5: Workflow Map

### Goal
Build the Workflow Map builder/viewer — the sequential operational visualization.

### Strict Requirements

#### 5.1 Workflow List (`/workflows`)
- [ ] List view of all Workflows using the generic List View component
- [ ] Columns: Title, Status, Number of Phases, Number of Processes, Number of Core Activities, Last Modified
- [ ] "Create New Workflow" button → Quick-Create Panel (Title, Description)
- [ ] Click row → navigate to Workflow Map (`/workflows/[id]`)

#### 5.2 Workflow Map Builder/Viewer (`/workflows/[id]`)
- [ ] Structured canvas layout — NOT freeform. Elements snap into place.
- [ ] **Phases** rendered as large horizontal sections/swim lanes:
  - Numbered sequentially (Phase 1, Phase 2, ...)
  - Editable title and description (inline editing — click to edit)
  - Status color coding on Phase header
  - "+" buttons above and below each Phase to add new Phases
- [ ] **Processes** rendered as blocks within Phases:
  - Numbered within Phase (1.1, 1.2, 2.1, 2.2, ...)
  - Process title displayed on block header
  - Click Process title → navigate to Process record page
  - Click Process block body → Preview Panel
  - "+" buttons above and below each Process block to add new Processes
- [ ] **Core Activities** rendered as items within Process blocks:
  - Listed in order within the Process
  - Title displayed (with status color indicator)
  - Click Core Activity → Preview Panel
  - Click Core Activity title → navigate to Core Activity record page
- [ ] **Handoff Blocks:**
  - Insertable between Phases or between Processes
  - Labeled (e.g., "Handoff: Sales → Project Management")
  - Editable label
  - Visually distinct from Process blocks
- [ ] **Numbering:** Auto-updates when items are reordered. Phases renumber, Processes renumber within Phases.

#### 5.3 Workflow Map — Toggle & Visibility Controls
- [ ] **Toggle controls at top:**
  - Roles toggle (show/hide role tags on Core Activities)
  - People toggle (show/hide people on Core Activities)
  - Software toggle (show/hide software icons on Core Activities)
  - Multiple toggles active simultaneously
  - State persisted per user
- [ ] **Visibility toggle:**
  - Show All (all statuses visible)
  - Active Only (only Active items shown — clean view)
  - Hide Archived (everything except Archived)
- [ ] **Status color coding:**
  - Draft = distinct draft color
  - In Review = distinct color
  - Active = default/primary color
  - Needs Update = distinct warning color
  - Archived = hidden by default (visible only in "Show All" mode)

#### 5.4 Workflow Map — Interaction
- [ ] **Drag-and-drop:**
  - Reorder Phases (drag Phase sections up/down)
  - Reorder Processes within Phases
  - Reorder Core Activities within Processes
  - Clear insertion line showing drop target during drag
  - Snappy, immediate visual feedback
- [ ] **Inline creation of Core Activities:**
  - "+" button below last Core Activity in a Process, or between Core Activities
  - Click "+" → text input appears inline
  - Type Core Activity title (validated: must start with action verb)
  - Enter → creates the Core Activity record (Draft status) and adds it to the Process
  - OR: search icon to find and add an existing Core Activity (searchable dropdown)
- [ ] **Create empty Process:** Add a Process with no Core Activities as a placeholder
- [ ] **Keyboard shortcuts:**
  - Enter = add next item (when focused on a CA or Process input)
  - Tab = indent/nest (contextual)
  - Delete/Backspace on empty item = remove it
- [ ] **Remove items:** X button on hover for Core Activities, Processes, and Phases (with confirmation for Phases)
- [ ] Back link → returns to All Workflows list

### Acceptance Criteria for Phase 5
- Workflow list displays all workflows with correct columns
- Creating a new workflow navigates to the builder
- Phases, Processes, and Core Activities render correctly in the structured layout
- Numbering is correct and auto-updates on reorder
- Drag-and-drop works for Phases, Processes, and Core Activities with visual feedback
- Toggle controls show/hide Roles, People, Software
- Visibility toggle filters by status correctly
- Status colors render correctly for all statuses
- Inline creation works: type title → creates CA and adds to Process
- Search-and-add existing CA works
- Handoff blocks can be created, labeled, and positioned
- Keyboard shortcuts work as specified
- All click behaviors (Preview Panel, record navigation) work
- Empty Processes can be created as placeholders
- Back navigation returns to All Workflows list

---

## MVP Phase 6: Global Search, Dashboard & Markdown Export

### Goal
Build the remaining unique screens and the export system.

### Strict Requirements

#### 6.1 Global Search
- [ ] Search input in top bar becomes functional
- [ ] Searches across all 7 object types + Workflows
- [ ] Results grouped by object type with section headers
- [ ] Each result shows: title, object type badge, status, and a relevant subtitle (e.g., Subfunction shows parent Function)
- [ ] Searches title, description, and key text fields
- [ ] Debounced input (300ms) with loading indicator
- [ ] Results appear in a dropdown below the search input
- [ ] Click a result → navigate to that record page
- [ ] "View all results" link → full search results page (`/search?q=...`)
- [ ] Full search results page: grouped by object type, each type expandable, pagination per type
- [ ] Empty state: "No results found for '[query]'"
- [ ] Keyboard navigation: arrow keys to move through results, Enter to select, Escape to close

#### 6.2 Dashboard (`/`)
- [ ] **Status Summary Cards** (top section, grid of cards):
  - Total Core Activities: Active count, Draft count, Needs Update count (each number clickable → filtered list)
  - Total Processes: Active count, Draft count, "Empty" count (no Core Activities) (each clickable)
  - Total Functions (clickable → Functions list)
  - Total Subfunctions (clickable → Subfunctions list)
- [ ] **Key Metrics** (secondary cards):
  - Number of People (clickable → People list)
  - Number of Roles (clickable → Roles list)
  - Total Software Spend (sum of all Software `total_current_cost`)
- [ ] **Recent Activity** (feed section):
  - Last 10 activity log entries across the entire organization
  - Each entry: user avatar, action description, record title (clickable), timestamp
- [ ] **Suggested Next Actions** (static/rule-based, not AI):
  - Generated from data conditions:
    - "You have X Draft Core Activities — start documenting" (if Draft CAs > 0)
    - "X Processes have no Core Activities" (if empty Processes exist)
    - "[Subfunction Name] needs an owner" (if Subfunction has no owner)
    - "X Core Activities need a primary Subfunction" (if CAs without Subfunction exist)
  - Each suggestion is clickable → navigates to the relevant list view or record
  - Suggestions update dynamically as data changes
- [ ] Responsive grid layout
- [ ] Loading skeletons for each section

#### 6.3 Markdown Export
- [ ] Export button consistently placed on every record page and map view (top right area)
- [ ] Two export options: "Download as .md" and "Copy to Clipboard"
- [ ] Export content structure per the MVP Specification:
  - **Core Activity:** Title, description, trigger, end state, status, video URL, all associations (roles, people, software, subfunction, processes)
  - **Process:** Title, description, trigger, end state, owners, status + all Core Activities with full details (ordered)
  - **Subfunction:** Title, description, owner, status + all Core Activities
  - **Function:** Title, description, owner, status + all Subfunctions + all Core Activities
  - **Workflow:** Title, description + each Phase (title, description) + each Process (full details) + each Core Activity (full details) + handoff labels
  - **Function Chart (full):** All Functions + all Subfunctions + all Core Activities
  - **Person:** All properties + all associations
  - **People (bulk):** Zip of individual markdown files, one per person
  - **Role:** All properties + all associations
  - **Software:** All properties + all associations
- [ ] Markdown output is clean, hierarchical, and uses proper heading levels
- [ ] Structure supports round-trip (could be re-imported — format consistent enough for future import parser)
- [ ] For "Copy to Clipboard": success toast notification

### Acceptance Criteria for Phase 6
- Global Search returns results across all object types, grouped correctly
- Search is fast (< 500ms for typical queries)
- Keyboard navigation works in search results dropdown
- Dashboard renders all sections with correct data
- All numbers on Dashboard are clickable and navigate to correct filtered views
- Suggested actions are generated correctly from data conditions
- Recent activity shows the last 10 entries with correct details
- Export button is present on all record pages and map views
- Markdown export produces correct, clean output for every object type and map
- Download and Copy to Clipboard both work
- Bulk People export produces a zip file

---

## MVP Phase 7: Settings, Polish & Launch Readiness

### Goal
Build settings pages, resolve edge cases, and ensure the app is production-ready.

### Strict Requirements

#### 7.1 Settings — Company Profile (`/settings/company`)
- [ ] Form with all Company Profile fields:
  - Company Name (text)
  - Industry (select dropdown)
  - Revenue (currency)
  - Employee Count (auto-calculated, read-only)
  - Location(s) (text)
  - Key Objectives (markdown editor)
  - Company Description (markdown editor)
  - Biggest Pains (markdown editor)
- [ ] Save button with success feedback
- [ ] Data stored in `organizations` table

#### 7.2 Settings — Object Configuration (`/settings/objects`)
- [ ] **Custom Properties management:**
  - Select object type from dropdown
  - List existing custom properties for that type
  - "Add Custom Property" button → form: property name, property type (text/number/date/select/multi-select/url/email/phone/currency/boolean), options (for select/multi-select)
  - Edit existing custom properties (name, type, options)
  - Delete custom property (with confirmation — warns that values will be lost)
  - Drag to reorder custom properties
- [ ] **Status/Lifecycle Customization:**
  - Only available for non-operational objects: Person, Role, Software
  - Show current status options
  - Add, rename, remove, reorder status options
  - Cannot customize operational objects (Function, Subfunction, Process, Core Activity) — shown as read-only with explanation
- [ ] **Association Visibility:**
  - Select object type
  - List all possible association sections for that type
  - Toggle each section on/off
  - This controls what appears in the right column of Record View for that object type
  - Applies to all records of that type (org-wide setting)

#### 7.3 Settings — User Management (`/settings/users`)
- [ ] List of users in the organization with: name, email, role (admin/member), status
- [ ] Invite user: email input → sends invite email → user signs up and is linked to org
- [ ] Change user role (admin can promote/demote)
- [ ] Remove user from organization (with confirmation)
- [ ] Only admins can access user management

#### 7.4 Notifications
- [ ] Basic notification system:
  - Notification entries created for: status changes on records you own, comments on records you own, association changes on records you own
  - Notification bell shows unread count badge
  - Click bell → dropdown showing recent notifications
  - Click notification → navigate to relevant record
  - Mark as read (individually or "mark all read")
- [ ] Stored in a `notifications` table with `user_id`, `record_id`, `record_type`, `message`, `read`, `created_at`

#### 7.5 Polish & Edge Cases
- [ ] All loading states show skeleton UI (not spinners)
- [ ] All error states show user-friendly messages with retry option
- [ ] All empty states show helpful messages and create actions
- [ ] Confirmation dialogs for destructive actions (delete record, remove association)
- [ ] Toast notifications for: save success, create success, delete success, error messages
- [ ] Form validation with inline error messages on all create/edit forms
- [ ] Core Activity title validation: must start with an action verb (validated on save with clear error message)
- [ ] Core Activity status validation: cannot change to Active without a primary Subfunction (validated with clear message)
- [ ] Responsive design: app usable (at minimum, not broken) on tablet-size screens
- [ ] Keyboard accessibility: all interactive elements focusable, Enter/Space to activate
- [ ] Consistent color palette for status indicators across all views
- [ ] Favicon and page titles set correctly for all routes
- [ ] 404 page with navigation back to Dashboard

#### 7.6 Performance
- [ ] List views with 100+ records load without jank
- [ ] Function Chart with 10+ Functions and 50+ Subfunctions renders smoothly
- [ ] Workflow Map with 5+ Phases and 20+ Processes renders smoothly
- [ ] No unnecessary re-renders on data mutations (optimistic updates where appropriate)
- [ ] Images (profile photos) lazy-loaded and properly sized

### Acceptance Criteria for Phase 7
- Company Profile saves and loads correctly
- Custom properties can be created, edited, deleted for any object type
- Custom properties appear on record views and are editable
- Status customization works for non-operational objects and is blocked for operational ones
- Association visibility settings apply correctly to Record Views
- User management: invite, role change, and removal all work
- Notifications are created for relevant events and display in the bell dropdown
- No console errors in production build
- All validation rules enforce correctly with clear user feedback
- App is responsive and accessible
- Performance targets met

---

## Post-MVP: Phase 2 — Content & Import

### Goal
Enable markdown import and introduce document management objects.

### Strict Requirements

#### P2.1 Markdown Import
- [ ] Import button on Function Chart and Workflow Map views
- [ ] Upload file or paste markdown text
- [ ] Parser interprets structure:
  - Function Chart: H1 = Function, H2/bullet = Subfunction, indented bullet = Core Activity
  - Workflow: H1 = Phase, H2/bullet = Process, indented bullet = Core Activity
- [ ] Preview parsed structure before confirming import (tree view showing what will be created)
- [ ] Scoped import: entire chart, single Function, single Subfunction, entire Workflow
- [ ] All imported items created as Draft status
- [ ] No associations included in import (roles, software, people added manually after)
- [ ] Round-trip: previously exported markdown can be re-imported and produce the same structure

#### P2.2 New Objects: SOP, Checklist, Template
- [ ] Database tables with all properties per schema
- [ ] Junction tables for all associations
- [ ] CRUD operations via API
- [ ] List Views, Record Views (or Document View for SOP/Checklist/Template)
- [ ] Quick-Create Panels
- [ ] Activity log integration

#### P2.3 Document View
- [ ] New view type for SOP, Checklist, Template
- [ ] Notion-style layout: Title at top → collapsible properties → markdown editor (full width)
- [ ] Markdown editor with formatting toolbar, live preview
- [ ] Side panel mode: opens as 1/3 to 1/2 of screen when accessed from association links
- [ ] Expand to full screen option
- [ ] Collapse properties to maximize editor space
- [ ] Paste support: paste list with line breaks → auto-creates checklist items

#### P2.4 Navigation Updates
- [ ] Add "Documents" nav group to left sidebar (SOPs, Checklists, Templates)
- [ ] Document objects appear in association columns across existing objects

### Acceptance Criteria
- Markdown import creates correct structures from properly formatted markdown files
- Preview shows parsed structure accurately before import
- SOP, Checklist, Template objects have full CRUD and views
- Document View renders with markdown editor, collapsible properties, and side panel mode
- New nav group appears and routes work

---

## Post-MVP: Phase 3 — AI Foundation

### Goal
Introduce the Ops Coach and AI-assisted content creation.

### Strict Requirements

#### P3.1 Ops Coach — Basic
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

#### P3.2 AI Content Labeling
- [ ] All AI-generated content visually labeled with AI badge/icon
- [ ] Label persists until human reviews and confirms (explicit "Approve" action)
- [ ] Approval removes AI label
- [ ] AI-generated vs. human-created distinction tracked in database

#### P3.3 Voice Input
- [ ] Microphone icon on all markdown fields
- [ ] Record → speech-to-text → AI cleanup pass → user reviews
- [ ] Available in Ops Coach panel

### Acceptance Criteria
- Ops Coach panel opens/closes, accepts text and voice input
- AI generates contextually relevant content (SOP drafts, property suggestions)
- AI content is labeled and can be approved/rejected
- Voice input transcribes and populates fields correctly

---

## Post-MVP: Phase 4 — Org & Metrics

### Strict Requirements
- [ ] Team object with full CRUD, views, and associations
- [ ] KPI object (reference records only — define what to measure)
- [ ] Feature object with parent Software relationship
- [ ] Org Chart map view with Singular/Comprehensive/People toggles
- [ ] Phase 4b: KPI actual value tracking, trend charts, Scorecards view
- [ ] Dashboard enhancements: People Spend, enhanced Software Spend
- [ ] Navigation updates: Team under People, KPIs nav group, Features under Resources, Org Chart under People

---

## Post-MVP: Phase 5 — External & Equipment

### Strict Requirements
- [ ] Vendor object with full CRUD, views, and associations
- [ ] Subcontractor object with full CRUD, views, and associations
- [ ] Equipment object with full CRUD, views, and associations
- [ ] PDF export for maps (Workflow Map → portrait, Function Chart → landscape)
- [ ] Navigation updates: Vendors, Subcontractors under People; Equipment under Resources

---

## Post-MVP: Phase 6 — Advanced AI

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

## Post-MVP: Phase 7 — Agent Platform

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
