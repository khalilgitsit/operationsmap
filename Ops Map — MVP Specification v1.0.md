## Purpose

This document is the single source of truth for what is being built in the MVP release of Ops Map. Everything in this document is in scope. Everything not in this document is out of scope for MVP and captured in the separate Roadmap document.

The MVP will be built using agentic coding (Claude Code) with a detailed implementation plan developed prior to development.

---

## Product Summary

Ops Map is an operational management platform for businesses of all types. It provides two complementary views of a business's operations:

- **Function Chart** (organizational view): Who owns what?
- **Workflow Map** (sequential view): How does work flow?

Both views are connected through a shared set of objects, with **Core Activity** as the atomic unit that bridges organizational structure and operational execution.

---

## MVP Scope

### What's In

- 7 objects: Function, Subfunction, Process, Core Activity, Person, Role, Software
- 2 map views: Function Chart (top-level + drill-down), Workflow Map (builder/viewer)
- 4 reusable view types: List View, Record View (three-column), Preview Panel, Quick-Create Panel
- Manual creation only (no AI, no import, no voice input)
- Markdown export at all levels
- Global Search
- Dashboard (basic — status summaries, recent activity, suggested next actions)
- User authentication and account management
- Custom properties on all objects
- Settings (object configuration, status customization, association visibility, company profile)

### What's Out (Captured in Roadmap)

- Ops Coach / AI assistant (all AI features)
- Voice input
- Markdown import
- PDF export
- SOP, Checklist, Template objects (Document View)
- Team, KPI, Feature, Vendor, Subcontractor, Equipment objects
- Org Chart map view
- Onboarding wizard with auto-populated data
- Interactive checklist completion
- KPI tracking and scorecards
- Mind sweep / gap analysis features

---

## Foundational Architecture Requirements

These are non-negotiable technical decisions that must be made at the foundation level, even though the features they enable are post-MVP.

### 1. Relational Database

All data is stored as properly typed, relational data. Objects have defined schemas. Associations are stored as relationships (junction tables for many-to-many). No data is stored as markdown — markdown is an export/interchange format only.

### 2. Agent-Ready API Layer

Alongside the app UI, the system exposes an API that serves structured data in a markdown-friendly format. This API allows external agents to:

- **Read** the current state of any object, workflow, function chart, or association without a human hitting "export"
- **Write** updates to objects, create new records, and modify associations
- The API serves the same data the UI uses, formatted for agent consumption (structured markdown or JSON with markdown content fields)

This is a design decision made at the database and API architecture level from day one. The API does not need to be feature-complete for MVP, but the data model and architecture must support it without refactoring later.

**MVP API scope:** Internal use only (powering the app UI). The agent-facing API endpoints are built post-MVP but the architecture supports them without restructuring.

### 3. Extensible Object Model

The system must support adding new objects without redesigning the core architecture. Each object follows the same pattern:

- Property schema (typed fields)
- Association map (relationships to other objects)
- Automatic list view generation
- Automatic record view generation (three-column layout)
- Status/lifecycle support

Adding a new object (e.g., "Equipment" or "KPI") should be a configuration exercise, not a rebuild.

### 4. Custom Properties

All objects support user-defined custom properties from MVP launch. This requires a flexible property system in the database (not hard-coded columns per object).

### 5. Breadcrumb-Ready Navigation

The routing system must support contextual breadcrumbs that track the user's path within a map context. Breadcrumbs show the path within a single map (Function Chart → Sales → Lead Management) but reset when the user jumps to a different object via an association click. The back link on a record page returns to that object's list view.

---

## Objects

### Universal Properties

Every object has these properties unless otherwise noted.

|Property|Type|Description|
|---|---|---|
|Title|Text|Display name (context-specific: "Function Title," "Role Title," etc.)|
|Description|Markdown|Rich text description|
|Status|Lifecycle|Default varies per object. Customizable in Settings for non-operational objects.|
|Created Date|Timestamp|Auto-generated|
|Last Modified|Timestamp|Auto-generated|
|Created By|User reference|Auto-generated|
|Modified By|User reference|Auto-generated|

### Status/Lifecycle

**Operational objects** (Function, Subfunction, Process, Core Activity, Phase) share the same default statuses. These are NOT customizable because they drive color coding on maps:

- Draft → In Review → Active → Needs Update → Archived

**Other objects** have their own defaults that ARE customizable in Settings.

---

### Function

The highest-level organizational bucket (Sales, Operations, Finance, etc.).

**View:** Record View (three-column) **Map Appearance:** Large block column in Function Chart

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Function Title|Text||
|Description|Markdown||
|Owner|Person reference||
|Status|Lifecycle|Draft / In Review / Active / Needs Update / Archived|
|Number of Subfunctions|Number|Auto-calculated|
|Number of Core Activities|Number|Auto-calculated (total across Subfunctions)|
|Number of Active Core Activities|Number|Auto-calculated|
|Number of Draft Core Activities|Number|Auto-calculated|
|Number of People|Number|Auto-calculated|
|Software Spend|Currency|Auto-calculated from associated Software|
|People Spend|Currency|Auto-calculated from associated People salaries|

**Associations:**

|Associated Object|Cardinality|Notes|
|---|---|---|
|Subfunction|One → Many|Parent-child|
|Role|Many-to-Many||
|People|Many-to-Many||
|Core Activities|One → Many (indirect)|Via Subfunctions. Displayed as link to filtered list view with count.|
|Workflow|Many-to-Many|Workflows that touch this Function's Subfunctions|
|Software|Many-to-Many|Aggregated from Subfunctions/Core Activities|

**Record Layout:**

- **Left:** Properties
- **Middle:** Activity feed (edits, comments, status changes, association changes — all timestamped)
- **Right:** Subfunctions, Core Activities (count + link to filtered list), Roles, People, Workflows, Software

---

### Subfunction

An operational area within a Function. Organizational home for Core Activities.

**View:** Record View (three-column) **Map Appearance:** Card within a Function block on Function Chart (like HubSpot deal cards). Shows people avatars and software icons when toggled on.

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Subfunction Title|Text||
|Description|Markdown||
|Owner|Person/Role reference||
|Parent Function|Function reference|Required|
|Status|Lifecycle|Draft / In Review / Active / Needs Update / Archived|
|Number of Core Activities|Number|Auto-calculated|
|Number of Active Core Activities|Number|Auto-calculated|
|Number of Draft Core Activities|Number|Auto-calculated|
|Number of People|Number|Auto-calculated|
|Number of Software Tools|Number|Auto-calculated|
|Software Spend|Currency|Auto-calculated|

**Associations:**

|Associated Object|Cardinality|Notes|
|---|---|---|
|Function|Many → One|Parent|
|Core Activity|One → Many|Primary organizational home|
|Role|Many-to-Many||
|People|Many-to-Many||
|Software|Many-to-Many||
|Process|Many-to-Many|Cross-reference|

**Record Layout:**

- **Left:** Properties
- **Middle:** Activity feed
- **Right:** Core Activities (expandable list, link to filtered view, or preview panel), Roles, People, Software, Processes

---

### Process

A series of Core Activities in sequence. Can cross functional boundaries. Reusable across multiple Workflows.

**View:** Record View (three-column) **Map Appearance:** Block within a Phase on Workflow Map. Numbered within Phase (1.1, 1.2, 2.1, etc.).

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Process Title|Text||
|Description|Markdown||
|Owner (Person)|Person reference||
|Owner (Role)|Role reference||
|Trigger|Markdown|What initiates this process|
|End State|Markdown|What "done" looks like|
|Status|Lifecycle|Draft / In Review / Active / Needs Update / Archived|
|Number of Core Activities|Number|Auto-calculated|
|Number Documented|Number|Auto-calculated (Active Core Activities)|
|Number in Draft|Number|Auto-calculated|
|Estimated Duration|Text||
|Last Revised|Date||
|Documented|Boolean|Auto-calculated: true if all Core Activities are Active|

**Associations:**

|Associated Object|Cardinality|Notes|
|---|---|---|
|Core Activity|Ordered Many-to-Many|Sequenced list|
|Workflow|Many-to-Many|Workflows this Process appears in|
|Subfunction|Many-to-Many|Cross-reference|
|Role (Involved)|Many-to-Many||
|People (Involved)|Many-to-Many||
|Software|Many-to-Many||

**Record Layout:**

- **Left:** Properties
- **Middle:** Activity feed
- **Right:** Core Activities (ordered list), Workflows, Subfunctions, Roles (Owner vs. Involved), People (Owner vs. Involved), Software

---

### Core Activity

The atomic unit. One specific, granular action. **Title must start with an action verb.** Has one primary Subfunction (organizational home). Can appear in multiple Processes.

**Validation Rule:** Must have a primary Subfunction assigned to change from Draft to Active.

**View:** Record View (three-column) **Map Appearance:** Item within Process block on Workflow Map; item under Subfunction column on Function Chart drill-down

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Core Activity Title|Text|Must start with an action verb|
|Description|Markdown||
|Trigger|Markdown|What causes this to start|
|End State|Markdown|What "done" looks like|
|Video|URL|Embeddable (Loom, YouTube, Vimeo, Google Drive). Plays inline.|
|Status|Lifecycle|Draft / In Review / Active / Needs Update / Archived|

**Associations:**

|Associated Object|Cardinality|Notes|
|---|---|---|
|Subfunction|Many → One|Primary organizational home (required for Active status)|
|Process|Many-to-Many|Can appear in multiple Processes|
|Role|Many-to-Many||
|People|Many-to-Many||
|Software|Many-to-Many||

**Record Layout:**

- **Left:** Properties (Title, Description, Trigger, End State, Video embed, Status, custom properties)
- **Middle:** Activity feed
- **Right:** Subfunction, Processes, Roles, People, Software

---

### Person

An individual in the organization. Operational record only — NOT a user account. User accounts are separate (managed in Settings).

**Note:** User-facing label is "People" (plural) in all navigation and association labels.

**View:** Record View (three-column) **Map Appearance:** Avatar on Subfunction cards in Function Chart (when toggled on)

**Properties:**

|Property|Type|Notes|
|---|---|---|
|First Name|Text||
|Last Name|Text||
|Email|Email|Work email|
|Mobile Phone|Phone||
|Work Phone|Phone||
|Personal Phone|Phone||
|Job Title|Text||
|Primary Role|Role reference||
|Primary Function|Function reference||
|Manager|Person reference||
|Start Date|Date||
|Tenure|Number|Auto-calculated years from Start Date|
|Salary|Currency|Annual|
|Location|Text||
|Work Arrangement|Select|In-Person / Remote / Hybrid|
|Emergency Contact Name|Text||
|Emergency Contact Phone|Phone||
|Emergency Contact Relationship|Text||
|Profile Photo|Image|Used for avatar (falls back to initials)|
|Status|Simple lifecycle|Active / Inactive|

**Associations:**

|Associated Object|Cardinality|Notes|
|---|---|---|
|Role (Primary)|Property|One|
|Role (Additional)|Many-to-Many||
|Function (Primary)|Property|One|
|Function (Additional)|Many-to-Many||
|Subfunction|Many-to-Many||
|Core Activity|Many-to-Many||
|Process (Owns)|Many-to-Many||
|Process (Involved In)|Many-to-Many||

**Record Layout:**

- **Left:** Properties
- **Middle:** Activity feed
- **Right:** Primary Role, Additional Roles, Primary Function, Additional Functions, Subfunctions, Core Activities, Processes (Owned), Processes (Involved In)

---

### Role

A seat in the organization, independent of who fills it.

**View:** Record View (three-column) **Map Appearance:** Tag on Core Activities and Subfunctions (when toggled on)

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Role Title|Text||
|Brief Description|Markdown||
|Job Description|Markdown|Expandable rich text field|
|Primary Function|Function reference||
|Status|Lifecycle|Active / Inactive / Open (unfilled)|
|Number of People|Number|Auto-calculated|
|Last Hired|Date|Auto-calculated|

**Associations:**

|Associated Object|Cardinality|Notes|
|---|---|---|
|People|Many-to-Many||
|Core Activity|Many-to-Many||
|Process (Owns)|Many-to-Many||
|Process (Involved In)|Many-to-Many||
|Subfunction|Many-to-Many||
|Function (Primary)|Property||
|Function (Additional)|Many-to-Many||

**Record Layout:**

- **Left:** Properties including Job Description (expandable)
- **Middle:** Activity feed
- **Right:** People, Core Activities, Processes (Owned vs. Involved), Subfunctions, Functions

---

### Software

A tool used in business operations.

**View:** Record View (three-column) **Map Appearance:** Icon on Subfunctions and Core Activities (when toggled on)

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Software Title|Text||
|Category|Multi-Select|Project Management, Accounting, CRM, Communication, etc.|
|URL|URL|Login/access link|
|Monthly Cost|Currency||
|Annual Cost|Currency||
|Pricing Model|Select|Per Seat / Flat Rate / Usage-Based / Tiered|
|Number of Seats|Number||
|Total Current Cost|Currency|Auto-calculated|
|Current Discount|Text||
|Renewal Date|Date||
|Billing Cycle|Select|Monthly / Annual|
|Status|Lifecycle|Active / Under Evaluation / Deprecated|

**Associations:**

|Associated Object|Cardinality|Notes|
|---|---|---|
|Core Activity|Many-to-Many||
|Process|Many-to-Many||
|Subfunction|Many-to-Many||
|Function|Many-to-Many||
|Role|Many-to-Many||
|People|Many-to-Many||

**Record Layout:**

- **Left:** Properties
- **Middle:** Activity feed
- **Right:** Core Activities, Processes, Subfunctions, Functions, Roles, People

---

## Maps

### Function Chart

**Top-Level View:**

- Functions displayed as large block columns (scroll left/right if needed)
- Each Function block contains Subfunction cards (like HubSpot deal/ticket cards)
- **Toggle controls at top:** Show/hide People avatars, Software icons, Roles
- **Sort control:** Reorder Functions alphabetically (A→Z, Z→A) or drag to custom order
- Hover any Function or Subfunction → description tooltip
- Click Function block header → drill down to Function Detail View
- Click Function title → open Function record page
- Click Subfunction card → Preview Panel
- "+" button to add new Functions (end of row) and new Subfunctions (top/bottom of Function block)
- Drag-and-drop to reorder Subfunctions within a Function

**Function Detail View (drill-down):**

- Same layout as top-level but scoped to single Function
- Subfunctions as columns, Core Activities listed under each
- Same toggle controls (People, Software, Roles)
- **Filter controls:** Filter entire view by Software, Person, or Role
- Hover Core Activity → description tooltip
- Click Core Activity → Preview Panel
- Click Core Activity title → open record page
- "+" button to add Core Activities at top/bottom of Subfunction column
- Drag-and-drop to reorder Core Activities within a Subfunction or move between Subfunctions
- Back link → returns to Function Chart top-level
- **Inline tagging on hover:** Hovering a Subfunction card shows "Add Associations" button → opens panel to tag People, Roles, Software without opening the full record

**Breadcrumbs (within map context):** Function Chart → [Function Name] → [Subfunction Name]

### Workflow Map

Visual builder/canvas. Structured and snappy — elements snap into place. NOT a freeform whiteboard.

- **Phases** as large horizontal sections/swim lanes. Numbered sequentially (Phase 1, Phase 2). Configurable title and description (editable inline).
- **Processes** as blocks within Phases. Numbered within Phase (1.1, 1.2, 2.1).
- **Core Activities** as items within Process blocks.
- **Handoff Blocks** between Phases or Processes. Clearly labeled (e.g., "Handoff: Sales → Project Management").
- **Status color coding:** Draft = draft color, Needs Update = distinct color, Active = default color, Archived = hidden by default.
- **Toggle controls at top:** Show/hide Roles, People, Software. Multiple can be active simultaneously.
- **Visibility toggle:** Show All / Active Only / Hide Archived.
- **Click behaviors:** Click Core Activity → Preview Panel. Click Core Activity title → full record. Click Process block → Preview Panel. Click Process title → full record.
- **Drag-and-drop:** Reorder Phases, Processes, Core Activities. Snappy with clear insertion line showing drop target. "+" icons for adding above/below any element.
- **Inline creation:** Create new Core Activities directly (type title, must start with action verb). Also search and add existing Core Activities. Create empty Processes (no Core Activities) as placeholders.
- **Keyboard shortcuts:** Enter = add next item. Tab = indent/nest. Delete/Backspace on empty = remove.
- **Numbering:** Auto-updates when items are reordered.

**Breadcrumbs (within map context):** All Workflows → [Workflow Name]

---

## View Types

### List View (all objects)

HubSpot-style filterable, sortable, searchable table. Used by all 7 objects.

- Column headers for key properties
- Sort by any column (ascending/descending)
- Filter by any property or association (e.g., filter Core Activities by Software = "BuilderTrend")
- Search within the list
- **Inline editing:** Select/dropdown fields (Role, Software, Status), reference fields, and simple text fields are editable directly in the table. Markdown fields require opening the full record. Phone/email fields open a formatted input box for validation.
- Column customization (show/hide columns)
- "Create New" button in list header
- Click row title → open full record page
- Changes reflect immediately across all views

### Record View — Three Column (all 7 objects)

- **Left column:** Properties (typed fields, editable)
- **Middle column:** Activity feed (edits, comments, status changes, association additions/removals — all timestamped with user attribution). Consistent across all objects.
- **Right column:** Associations. Each association section is expandable/collapsible. Associations are clickable (open the linked record or Preview Panel). Users can add/create new associations directly from this column. Association sections can be enabled/disabled per object type in Settings.

Association counts link to filtered list views (e.g., "34 Core Activities" → opens Core Activities list filtered to this Role).

### Preview Panel (universal overlay)

Slides in from the right side when clicking a linked record from a map view, list view, or association column.

- Stacked single-column layout: Properties at top → Associations below → Recent activity (condensed)
- Editable fields can be changed directly
- "Open Full Record" link at top
- Close button to return to previous view
- From the Preview Panel, clicking an association opens THAT record's preview (replacing the current panel content)

### Quick-Create Panel (universal overlay)

Slides in from the right side when creating a new record from a list view, map view, or association column.

- Essential fields only (varies by object — typically Title, key references like Primary Role/Function, and Status)
- Two buttons at bottom:
    - **Create** — saves and opens the full record page
    - **Create and Add Another** — saves, clears the form, stays in current view
- When creating a Person: Primary Role field allows inline creation of new Roles (type a name → "Create Role: [name]"). Primary Function does NOT allow inline creation (info button: "Functions should be set intentionally. Manage them in the Function Chart.").

---

## Navigation

### Top Bar (left to right)

|Element|Function|
|---|---|
|App Logo|Click → Home/Dashboard|
|Global Search|Search across all objects and maps. Results grouped by object type.|
|Create New|Dropdown → select object type → Quick-Create Panel|
|Notifications|Activity alerts, mentions, updates|
|Settings (gear)|Account settings, object configuration, custom properties, status customization, association visibility, company profile, user management|
|Profile Avatar|Personal settings, account switcher, preferences|

**Note:** The Ops Coach icon is NOT in the MVP top bar. Space should be reserved for it in the layout so it can be added without redesigning the nav.

### Left Sidebar

Collapsible. Icon-only mode when collapsed. Hover to expand groups.

|Nav Group|Icon|Items|
|---|---|---|
|**Home**|Dashboard icon|Dashboard (no sub-nav)|
|**Workflows**|Map/flow icon|All Workflows, Processes|
|**Functions**|Function/grid icon|Function Chart, Functions, Subfunctions|
|**Core Activities**|Activity/atom icon|All Core Activities (master list)|
|**People**|People icon|People, Roles|
|**Resources**|Toolbox icon|Software|

**Note:** Nav groups for Documents, KPIs, and additional items under People and Resources will be added as those objects are built. The sidebar should support adding new groups without redesign.

### Breadcrumb Pattern

Breadcrumbs show the navigation path **within a single map context** and reset when the user jumps to a different object via an association click.

|Scenario|Breadcrumb Shows|
|---|---|
|Viewing Function Detail|Function Chart → Sales|
|Viewing Subfunction drill-down|Function Chart → Sales → Lead Management|
|Click Core Activity from Function Chart → open record|Breadcrumb resets to: Core Activities (back link to list)|
|Click association on record (e.g., Role from Core Activity)|Breadcrumb resets to: Roles (back link to list)|
|Workflow Map|All Workflows → Client Journey|

Browser back button retraces the full navigation path regardless.

---

## Dashboard (MVP — Basic)

The Dashboard is the landing page. MVP version is functional but minimal.

**Content:**

- **Status Summary Cards:** Total Core Activities (Active / Draft / Needs Update). Total Processes (Active / Draft / Empty). Total Functions. Total Subfunctions. Each number is clickable → opens filtered list view.
- **Key Metrics:** Number of People, Number of Roles, Total Software Spend
- **Recent Activity:** Last 10 changes across the system (who, what, when)
- **Suggested Next Actions:** Static/rule-based suggestions (not AI): "You have 12 Draft Core Activities — start documenting," "3 Processes have no Core Activities," "Lead Management Subfunction needs an owner"

**What's NOT in MVP Dashboard:** Ops Coach prompts, Questions to Answer, People Spend/Equipment Spend, mind sweep, onboarding wizard with auto-populated data. The onboarding for MVP is documentation/help content, not an interactive wizard.

---

## Markdown Export

Available on every record page and every map view. Consistently placed export button (top right area).

**Export options:** Download as .md file, or Copy to Clipboard.

**Export scope and structure:**

|Level|Content Included|
|---|---|
|Core Activity|Title, description, trigger, end state, status, video URL, all associations (roles, people, software, subfunction, processes)|
|Process|Title, description, trigger, end state, owners, status + all Core Activities with their full details (ordered)|
|Subfunction|Title, description, owner, status + all Core Activities|
|Function|Title, description, owner, status + all Subfunctions + all Core Activities|
|Workflow|Title, description + each Phase (title, description) + each Process (full details) + each Core Activity (full details) + handoff labels|
|Function Chart|All Functions + all Subfunctions + all Core Activities|
|Person|All properties + all associations|
|People (bulk)|Zip/folder of individual markdown files, one per person|
|Role|All properties + all associations|
|Software|All properties + all associations|

The markdown output is clean, hierarchical, and structured enough that it could be re-imported in a future version (round-trip capability). This is the foundation for the agent-ready architecture.

---

## Settings

### Company Profile

|Field|Type|
|---|---|
|Company Name|Text|
|Industry|Select|
|Revenue|Currency|
|Employee Count|Number (auto from People)|
|Location(s)|Text|
|Key Objectives|Markdown|
|Company Description|Markdown|
|Biggest Pains|Markdown|

### Object Configuration

- Custom properties: Add user-defined properties to any object
- Status/lifecycle: Customize status options for non-operational objects (Person, Role, Software). Operational objects (Function, Subfunction, Process, Core Activity) have fixed statuses.
- Association visibility: Enable/disable which association sections appear on each object's record view

### User Management

- User accounts (separate from Person records, optionally linked)
- Permissions and access control (basic for MVP — admin vs. standard user)

---

## MVP Screen Inventory

|#|Screen|Type|Priority|
|---|---|---|---|
|1|**Dashboard / Home**|Unique|Core|
|2|**Function Chart — Top Level**|Map|Core|
|3|**Function Chart — Function Detail**|Map|Core|
|4|**Workflow Map — Builder/Viewer**|Map|Core|
|5|**List View**|Generic (all 7 objects)|Core|
|6|**Record View — Three Column**|Generic (all 7 objects)|Core|
|7|**Preview Panel**|Generic (overlay)|Core|
|8|**Quick-Create Panel**|Generic (overlay)|Core|
|9|**Global Search Results**|Unique|Core|
|10|**Settings — Company Profile**|Settings|Core|
|11|**Settings — Object Configuration**|Settings|Core|
|12|**Settings — User Management**|Settings|Core|
|13|**Login / Authentication**|Unique|Core|

**13 screens total.** 4 are generic/reusable across all objects. 4 are map views (but only 3 unique layouts — Function Detail reuses the Function Chart pattern). 4 are settings/auth. 2 are unique (Dashboard, Search Results).

---

## Association Map (MVP Objects Only)

|From|To|Cardinality|Notes|
|---|---|---|---|
|Function|Subfunction|1:M|Parent-child|
|Subfunction|Core Activity|1:M|Primary organizational home|
|Process|Core Activity|M:M|Ordered sequence|
|Workflow (map)|Process|M:M|Workflow contains Processes|
|Core Activity|Role|M:M||
|Core Activity|People|M:M||
|Core Activity|Software|M:M||
|Process|Subfunction|M:M|Cross-reference|
|Process|Role (Involved)|M:M||
|Process|People (Involved)|M:M||
|Process|Software|M:M||
|Role|People|M:M||
|Role|Function|M:M|(+Primary as property)|
|Role|Subfunction|M:M||
|Person|Role|M:M|(+Primary as property)|
|Person|Function|M:M|(+Primary as property)|
|Person|Subfunction|M:M||
|Person|Core Activity|M:M||
|Person|Process (Owns)|M:M||
|Person|Process (Involved)|M:M||
|Software|Function|M:M||
|Software|Subfunction|M:M||
|Software|Process|M:M||
|Software|Role|M:M||
|Software|People|M:M||
|Function|Role|M:M||
|Function|People|M:M||
|Function|Workflow|M:M|Cross-reference|
|Function|Software|M:M||