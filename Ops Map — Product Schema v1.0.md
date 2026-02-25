## Overview

Ops Map is an operational management platform for businesses of all types. While many early users are construction companies, the platform is industry-agnostic and serves any company that needs to document, visualize, and manage its operations.

The platform provides two complementary views of a business's operations:

- **Function Chart** (organizational view): Who owns what?
- **Workflow Map** (sequential view): How does work flow?

Both views are connected through a shared set of objects, with **Core Activity** serving as the atomic unit that bridges organizational structure and operational execution.

The system supports **markdown export at every level** — any object, map, or view can be exported as clean markdown for AI agent consumption and external use. The UI itself is a fully functional application with properties, associations, and visual tools. Markdown is the export/portability layer, not the primary interface (except for Document View objects like SOPs, Checklists, and Templates, which use a markdown editor as their primary editing experience).

---

## Architecture

### Maps (Visual Tools)

Maps are spatial/visual canvases that arrange objects. They do not have properties or associations of their own — they are lenses on the data. Maps are NOT freeform whiteboards. They are structured, snappy, and click-into-place — more like HubSpot's board view or workflow tool than a whiteboarding tool like Miro.

|Map|Purpose|Internal Structure|
|---|---|---|
|**Function Chart**|Organizational/structural view|Functions → Subfunctions → Core Activities|
|**Workflow Map**|Sequential/temporal view|Phases → Processes → Core Activities|
|**Org Chart**|People/role mapping|Teams → Roles → People|

### Objects (Records with Properties & Associations)

Objects are the data layer. Each object has a defined property set, association rules, and a standard record page (three-column layout) or document view (markdown editor).

**16 Objects Total:**

|Tier|Objects|
|---|---|
|**MVP (Tier 1)**|Function, Subfunction, Process, Core Activity, Person, Role, Software, SOP, Checklist|
|**Tier 2**|Team, Template, KPI, Feature|
|**Tier 3**|Vendor, Subcontractor, Equipment|

### Structural Elements (Not Objects)

These exist only as organizational layers within Maps. They do not have their own record pages.

|Element|Lives In|Purpose|
|---|---|---|
|**Phase**|Workflow Map|Groups Processes into stages (e.g., "Pre-Construction," "Design," "Closeout"). Numbered sequentially (Phase 1, Phase 2, etc.). Has basic configurable properties: title, description.|

### View Types

|View Type|Used By|Description|
|---|---|---|
|**Map View**|Function Chart, Workflow Map, Org Chart|Spatial, visual, structured canvas. Not freeform — elements snap into place with clear grid/structure.|
|**List View**|All 16 objects|Filterable, sortable, searchable table (HubSpot-style). Inline editing on select fields (e.g., change Role from list view, select Software from dropdown).|
|**Record View**|All objects except SOP, Checklist, Template|Three-column layout: Properties / Activity Feed / Associations|
|**Document View**|SOP, Checklist, Template|Notion-style layout: Title at top → properties below title (collapsible) → markdown editor as main content area. Can open as side panel (1/3 to 1/2 screen) from association links, or expand to full screen.|
|**Dashboard View**|Home page|Operational health metrics, recent activity, onboarding guidance, quick actions.|

### Universal UI Patterns

**Preview Panel:** Available everywhere in the app (list views, map views, record views). When clicking a linked record, a panel slides in from the right side showing a stacked single-column view: properties at top, recent activity in middle, associations at bottom. From the preview, you can click through to the full record or collapse the panel. Certain fields are editable directly from the preview.

**Association Column Customization:** In Settings, users can enable/disable which association sections appear on each object's record view. All associations exist in the data model but users control what's visible on screen. Users can add new associations or create new records directly from the right-hand association column.

**Activity Feed (consistent across all objects):** Edits, comments, status changes, new associations added/removed, all timestamped with user attribution. This always lives in the middle column of the Record View.

---

## Navigation

### Top Bar (left to right)

|Element|Function|
|---|---|
|App Logo|Click to return to Home/Dashboard|
|Global Search|Search across all objects and maps|
|Create New|Dropdown to create any object type|
|Notifications|Activity alerts, mentions, updates|
|Ops Coach|Toggle for AI assistant|
|Settings (gear)|Account settings, object configuration, user/permission management, custom properties, status/lifecycle settings, company profile|
|Profile Avatar|Personal settings, account switcher, preferences|

### Left Sidebar

Collapsible. Icon-only mode when collapsed. Hover to expand groups and see sub-navigation items.

|Nav Group|Icon|Items|
|---|---|---|
|**Home**|Dashboard icon|Dashboard (no sub-nav)|
|**Workflows**|Map/flow icon|All Workflows, Processes|
|**Functions**|Function/grid icon|Function Chart, Functions, Subfunctions|
|**Core Activities**|Activity/atom icon|All Core Activities (master list)|
|**People**|People icon|Org Chart, People, Roles, Teams, Vendors, Subcontractors|
|**Resources**|Toolbox icon|Software, Features, Equipment|
|**Documents**|File icon|SOPs, Checklists, Templates|
|**KPIs**|Gauge/chart icon|All KPIs, Scorecards (Tier 2)|

---

## Company Profile

Accessible from Settings. Stores company-level context used by the Ops Coach AI and across the platform.

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Company Name|Text||
|Industry|Select|Construction, Manufacturing, Professional Services, etc.|
|Revenue|Currency|Annual revenue|
|Employee Count|Number|Auto-calculated from People records|
|Location(s)|Text|Headquarters and other locations|
|Key Objectives|Markdown|What the company is working toward|
|Company Description|Markdown|What the company does, what they offer/sell|
|Target Market|Markdown|Who they serve|

---

## Onboarding Flow

New accounts go through a guided onboarding experience that collects company information (populates Company Profile), helps users understand the platform, and guides them through creating their first Function Chart and Workflow. The Dashboard surfaces onboarding tasks and progress until the user has completed initial setup.

---

## Object Schemas

### Universal Properties

These properties exist on every object unless otherwise noted.

|Property|Type|Description|
|---|---|---|
|Title|Text|Display name of the record (object-specific: "Function Title," "Process Title," etc.)|
|Description|Markdown|Rich text description|
|Status|Lifecycle|Default varies per object type (see individual schemas). Customizable in Settings.|
|Created Date|Timestamp|Auto-generated|
|Last Modified|Timestamp|Auto-generated|
|Created By|User reference|Auto-generated|
|Modified By|User reference|Auto-generated|

**Note on "Title" vs. "Name":** All objects use "Title" as the primary label field to maintain consistency and avoid collision with "First Name" / "Last Name" on Person records. In context, it reads as "Function Title," "Role Title," etc.

### Status/Lifecycle Defaults

The following objects share the same default status options to enable color-coded visualization on maps:

**Operational Objects (shared default):** Function, Subfunction, Process, Core Activity, Phase (structural element)

- Draft → In Review → Active → Needs Update → Archived
- These statuses drive color coding on Function Chart and Workflow Map views
- NOT customizable for these objects (required for consistent visualization)

**All other objects:** Have their own default statuses defined below, which ARE customizable in Settings.

---

### Tier 1 — MVP Objects

---

#### Function

The highest-level organizational bucket. Represents a major area of the business (Sales, Operations, Finance, etc.).

**View:** Record View (three-column layout) **Map Appearance:** Large block in Function Chart

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Function Title|Text|e.g., "Sales," "Operations," "Finance"|
|Description|Markdown|Purpose and scope of this function|
|Owner|Person reference|Who is ultimately accountable|
|Status|Lifecycle|Draft / In Review / Active / Needs Update / Archived|
|Number of People|Number|Auto-calculated from associated People|
|Number of Subfunctions|Number|Auto-calculated|
|Number of Core Activities|Number|Auto-calculated (total across all Subfunctions)|
|Number of Active Core Activities|Number|Auto-calculated|
|Number of Draft Core Activities|Number|Auto-calculated|
|Software Spend|Currency|Auto-calculated from associated Software costs|
|People Spend|Currency|Auto-calculated from associated People salaries|
|Equipment Spend|Currency|Auto-calculated from associated Equipment costs|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Subfunction|Parent → Children|One Function → Many Subfunctions|
|Role|Tagged|Many-to-Many|
|Team|Tagged|Many-to-Many|
|People|Tagged|Many-to-Many|
|Core Activities|Aggregated via Subfunctions (link to pre-filtered list view)|One → Many (indirect)|
|Workflow|Cross-reference (Workflows that contain Processes touching this Function's Subfunctions)|Many-to-Many|
|Software|Aggregated via Subfunctions/Core Activities|Many-to-Many|
|Equipment|Tagged|Many-to-Many|
|Vendor|Tagged|Many-to-Many|
|Subcontractor|Tagged|Many-to-Many|
|KPI|Tagged|Many-to-Many|

**Record Layout:**

- **Left column:** Properties
- **Middle column:** Activity feed (edits, comments, status changes, new associations added)
- **Right column:** Subfunctions, Core Activities (link to filtered list view showing count: "24 Core Activities — 18 Active, 6 Draft"), Roles, Teams, People, Workflows, Software, Equipment, Vendors, Subcontractors, KPIs

**Notes:** Core Activities appear as an association link that opens the Core Activities list view pre-filtered to this Function. The property cards show active vs. draft counts for quick operational health visibility.

---

#### Subfunction

An operational area within a Function. This is where Core Activities are organizationally housed.

**View:** Record View (three-column layout) **Map Appearance:** Card within a Function block on Function Chart (similar to HubSpot deal/ticket cards). Shows people avatars and software icons.

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Subfunction Title|Text|e.g., "Lead Management," "Proposal Development"|
|Description|Markdown||
|Owner|Person/Role reference||
|Parent Function|Function reference|Required. Each Subfunction belongs to one Function.|
|Status|Lifecycle|Draft / In Review / Active / Needs Update / Archived|
|Number of Core Activities|Number|Auto-calculated|
|Number of Active Core Activities|Number|Auto-calculated|
|Number of Draft Core Activities|Number|Auto-calculated|
|Number of People|Number|Auto-calculated|
|Number of Software Tools|Number|Auto-calculated|
|Number of Software Features|Number|Auto-calculated|
|Software Spend|Currency|Auto-calculated|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Function|Child → Parent|Many Subfunctions → One Function|
|Core Activity|Parent → Children|One Subfunction → Many Core Activities (primary home)|
|Role|Tagged|Many-to-Many|
|People|Tagged (avatars visible on Function Chart)|Many-to-Many|
|Software|Tagged (icons visible on Function Chart)|Many-to-Many|
|Feature|Tagged|Many-to-Many|
|Process|Cross-reference|Many-to-Many|
|Equipment|Tagged|Many-to-Many|
|Vendor|Tagged|Many-to-Many|
|Subcontractor|Tagged|Many-to-Many|
|KPI|Tagged|Many-to-Many|
|SOP|Cross-reference (SOPs for Core Activities in this Subfunction)|Many-to-Many|
|Checklist|Cross-reference|Many-to-Many|
|Template|Cross-reference|Many-to-Many|

**Record Layout:**

- **Left column:** Properties
- **Middle column:** Activity feed
- **Right column:** Core Activities (link to filtered list view, or expandable inline with preview; can also open as sliding panel from right), Roles, People, Software, Features, Processes, Equipment, Vendors, Subcontractors, KPIs, SOPs, Checklists, Templates

**Association Interaction Patterns:** When clicking "Core Activities" in the right column, users can:

1. See a count with link to filtered list view
2. Expand inline to see a dropdown/preview of Core Activities
3. Click into a preview panel that slides in from the right (replacing the association column temporarily, with a back button to return)
4. Click through to the full Core Activity record

---

#### Process

A series of Core Activities performed in sequence to achieve a specific result. Processes can cross functional boundaries. The same Process can appear in multiple Workflows. Processes are numbered within their Phase (e.g., 1.1, 1.2, 2.1, 2.2).

**View:** Record View (three-column layout) **Map Appearance:** Block within a Phase on the Workflow Map

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Process Title|Text|e.g., "Project Setup," "Change Order Processing"|
|Description|Markdown||
|Owner (Person)|Person reference|Person accountable for this process|
|Owner (Role)|Role reference|Role accountable for this process (may have multiple people in this role across teams)|
|Trigger|Markdown|What initiates this process|
|End State|Markdown|What "done" looks like|
|Status|Lifecycle|Draft / In Review / Active / Needs Update / Archived|
|Number of Core Activities|Number|Auto-calculated|
|Number Documented|Number|Auto-calculated (Core Activities with status Active)|
|Number in Draft|Number|Auto-calculated|
|Estimated Duration|Text|How long the process typically takes|
|Last Revised|Date|When the process was last reviewed/updated|
|Documented|Boolean|Auto-calculated: true if all Core Activities are Active status|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Core Activity|Ordered list|One Process → Many Core Activities (sequenced)|
|Workflow|Referenced by|Many-to-Many|
|Subfunction|Cross-reference|Many-to-Many|
|Role (Involved)|Many-to-Many|Roles involved in execution|
|Role (Owner)|Property|The role that owns this process|
|People (Involved)|Many-to-Many|People involved in execution|
|People (Owner)|Property|The person that owns this process|
|Team|Tagged|Many-to-Many|
|Software|Aggregated from Core Activities + direct tagging|Many-to-Many|
|Feature|Aggregated from Core Activities + direct tagging|Many-to-Many|
|Equipment|Tagged|Many-to-Many|
|Vendor|Tagged|Many-to-Many|
|Subcontractor|Tagged|Many-to-Many|
|KPI|Tagged|Many-to-Many|
|SOP|Cross-reference (SOPs for Core Activities in this Process)|Many-to-Many|
|Checklist|Cross-reference|Many-to-Many|
|Template|Cross-reference|Many-to-Many|

**Record Layout:**

- **Left column:** Properties
- **Middle column:** Activity feed
- **Right column:** Core Activities (ordered list — this is the sequence view), Workflows, Subfunctions, Roles (separated: Owner vs. Involved), People (separated: Owner vs. Involved), Teams, Software, Features, Equipment, Vendors, Subcontractors, KPIs, SOPs, Checklists, Templates

**Note on Roles/People distinction:** Both Process and other objects need to differentiate between "owns" and "is involved in." A Process has one Owner Role and one Owner Person (properties), plus many Involved Roles and Involved People (associations).

**Future (Tier 2):** Toggle-able mini visual flow at the top of the activity feed showing Core Activity sequence.

---

#### Core Activity

The atomic unit of the entire system. The single most important object. A Core Activity is one specific, granular action that someone takes. **Core Activity titles must start with an action verb** (e.g., "Add project to BuilderTrend," "Send preliminary estimate to customer," "Assign project to project manager").

A Core Activity has one primary Subfunction (organizational home) and can appear in one or more Processes (sequential context).

**View:** Record View (three-column layout) **Map Appearance:** Item within a Process block on Workflow Map; item under a Subfunction column on Function Chart drill-down

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Core Activity Title|Text|Must start with an action verb|
|Description|Markdown|What this activity is and why it matters|
|Trigger|Markdown|What causes this activity to start|
|End State|Markdown|What "done" looks like for this specific activity|
|Video|URL|Embeddable video link (plays inline without leaving the app)|
|Status|Lifecycle|Draft / In Review / Active / Needs Update / Archived|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Subfunction|Primary organizational home|Many Core Activities → One Subfunction|
|Process|Sequential context|Many-to-Many|
|Role|Tagged|Many-to-Many|
|People|Tagged|Many-to-Many|
|Software|Tagged|Many-to-Many|
|Feature|Tagged|Many-to-Many|
|SOP|Associated document|Many-to-Many|
|Checklist|Associated document|Many-to-Many|
|Template|Associated document|Many-to-Many|
|Equipment|Tagged|Many-to-Many|
|KPI|Tagged|Many-to-Many|
|Vendor|Tagged|Many-to-Many|
|Subcontractor|Tagged|Many-to-Many|

**Record Layout:**

- **Left column:** Properties (Title, Description, Trigger, End State, Video embed, Status, custom properties)
- **Middle column:** Activity feed
- **Right column:** All associations — Subfunction, Processes, Roles, People, Software, Features, SOPs, Checklists, Templates, Equipment, KPIs, Vendors, Subcontractors

---

#### Person

An individual in the organization. This is an operational record, NOT a user account. User accounts (for app login) are a separate concept managed in Settings and can optionally be linked to a Person record.

**View:** Record View (three-column layout) **Map Appearance:** Avatar on Subfunction cards in Function Chart; node in Org Chart

**Note:** Use "People" (plural) in all navigation and association labels. The object is called "Person" in the schema but the user-facing label is "People."

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
|Primary Role|Role reference|Their main role in the organization|
|Primary Function|Function reference|Their main functional area|
|Manager|Person reference|Direct report to|
|Start Date|Date|When they started with the company|
|Tenure|Number|Auto-calculated years from Start Date|
|Salary|Currency|Annual salary|
|Location|Text|Office location or job site|
|Work Arrangement|Select|In-Person / Remote / Hybrid|
|Emergency Contact Name|Text||
|Emergency Contact Phone|Phone||
|Emergency Contact Relationship|Text||
|Profile Photo|Image|Used for avatar display on maps|
|Status|Simple lifecycle|Active / Inactive|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Role (Primary)|Property|One primary role|
|Role (Additional)|Tagged|Many-to-Many|
|Function (Primary)|Property|One primary function|
|Function (Additional)|Tagged|Many-to-Many|
|Subfunction|Tagged|Many-to-Many|
|Team|Member of|Many-to-Many|
|Core Activity|Tagged to|Many-to-Many|
|Process (Owns)|Cross-reference|Many-to-Many|
|Process (Involved In)|Cross-reference|Many-to-Many|

**Record Layout:**

- **Left column:** Properties
- **Middle column:** Activity feed
- **Right column:** Primary Role, Additional Roles, Primary Function, Additional Functions, Subfunctions, Teams, Core Activities, Processes (Owned), Processes (Involved In)

---

#### Role

A seat or function in the organization, independent of who fills it. Roles persist even when people change.

**View:** Record View (three-column layout) **Map Appearance:** Node on Org Chart (with count label showing how many people fill this role), tag on Core Activities and Subfunctions

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Role Title|Text|e.g., "Project Manager," "Estimator," "Office Manager"|
|Brief Description|Markdown|Short summary of responsibilities|
|Job Description|Markdown|Full job description (expandable rich markdown field)|
|Primary Function|Function reference|Primary functional area|
|Status|Lifecycle|Active / Inactive / Open (unfilled)|
|Number of People|Number|Auto-calculated: how many people currently fill this role|
|Last Hired|Date|Auto-calculated from most recent Person with this as Primary Role|
|Created Date|Date|When the role was created|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|People|Filled by|Many-to-Many|
|Core Activity|Responsible for|Many-to-Many|
|Process (Owns)|Owner of|Many-to-Many|
|Process (Involved In)|Participates in|Many-to-Many|
|Subfunction|Operates within|Many-to-Many|
|Function (Primary)|Property|One primary function|
|Function (Additional)|Tagged|Many-to-Many|
|Team|Belongs to|Many-to-Many|
|KPI|Accountable for|Many-to-Many|

**Record Layout:**

- **Left column:** Properties including Job Description (expandable markdown field)
- **Middle column:** Activity feed
- **Right column:** People, Core Activities, Processes (Owned vs. Involved), Subfunctions, Functions, Teams, KPIs

---

#### Software

A tool used in business operations.

**View:** Record View (three-column layout) **Map Appearance:** Icon on Subfunctions and Core Activities in Function Chart

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Software Title|Text|e.g., "BuilderTrend," "QuickBooks," "Google Drive"|
|Category|Multi-Select|Project Management, Accounting, CRM, Communication, etc.|
|URL|URL|Login/access link|
|Monthly Cost|Currency|Per-unit monthly cost|
|Annual Cost|Currency|Per-unit annual cost|
|Pricing Model|Select|Per Seat / Flat Rate / Usage-Based / Tiered|
|Number of Seats|Number|How many licenses/seats purchased|
|Total Current Cost|Currency|Auto-calculated (monthly cost × seats × 12 or annual cost × seats)|
|Current Discount|Text|Any active discount or promotional pricing|
|Renewal Date|Date|When the subscription renews|
|Billing Cycle|Select|Monthly / Annual|
|Status|Lifecycle|Active / Under Evaluation / Deprecated|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Feature|Parent → Children|One Software → Many Features|
|Feature (Used)|Filtered subset|Features with status "Active"|
|Feature (Not Used)|Filtered subset|Features with status "Not Using"|
|Core Activity|Used in|Many-to-Many|
|Process|Used in|Many-to-Many|
|Subfunction|Supports|Many-to-Many|
|Function|Supports|Many-to-Many|
|Role|Used by|Many-to-Many|
|People|Used by|Many-to-Many|
|Template|Hosts|Many-to-Many|
|SOP|Referenced in|Many-to-Many|
|Checklist|Referenced in|Many-to-Many|
|Vendor|Provided by|Many-to-Many|
|Subcontractor|Used by|Many-to-Many|

**Feature Redundancy:** When two Software tools have Features that serve the same purpose (e.g., quoting in both HubSpot and BuilderTrend), the Feature records can be tagged to show overlap. Features have a status (Active / Not Using / Planned) that indicates which tool the company actually uses for that capability. This surfaces redundancy at the Software record level.

**Record Layout:**

- **Left column:** Properties
- **Middle column:** Activity feed
- **Right column:** Features (separated: Used / Not Used), Core Activities, Processes, Subfunctions, Functions, Roles, People, Templates, SOPs, Checklists, Vendors, Subcontractors

---

#### SOP (Standard Operating Procedure)

A document explaining how to perform a specific activity or set of activities. Markdown-native.

**View:** Document View (Notion-style: Title → Properties (collapsible) → Markdown Editor). Can also open as a side panel (1/3 to 1/2 of screen width) when accessed from an association link, with option to expand to full screen.

**Properties:**

|Property|Type|Notes|
|---|---|---|
|SOP Title|Text||
|Content|Markdown|The full SOP content — this IS the primary view|
|Trigger|Markdown|What initiates the need for this SOP|
|End State|Markdown|What the completed result looks like|
|Version|Number|Auto-incremented on publish|
|Last Reviewed|Date||
|Created Date|Date|Auto-generated|
|Status|Lifecycle|Draft → In Review → Published → Needs Update → Archived|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Core Activity|Documents|Many-to-Many|
|Process|Cross-reference|Many-to-Many|
|Subfunction|Cross-reference|Many-to-Many|
|Function|Cross-reference|Many-to-Many|
|Role|Audience|Many-to-Many|
|People|Audience|Many-to-Many|
|Software|Referenced|Many-to-Many|
|Vendor|Referenced|Many-to-Many|
|Subcontractor|Referenced|Many-to-Many|

**Document View Layout:**

- **Top:** SOP Title
- **Below title:** Properties (collapsible section — status, version, last reviewed, trigger, end state)
- **Main area:** Markdown editor (full width)
- **Sidebar (when opened from association link):** Properties on top, markdown content below. Can expand to full screen. Can collapse properties to maximize editing space.

**Export:** Exportable as markdown in Tier 1.

---

#### Checklist

A step-by-step list used during execution of a Core Activity. Markdown-native.

**View:** Document View (same Notion-style layout as SOP)

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Checklist Title|Text||
|Content|Markdown|Ordered checklist items — the primary view|
|Version|Number||
|Last Reviewed|Date||
|Created Date|Date|Auto-generated|
|Status|Lifecycle|Draft → In Review → Published → Needs Update → Archived|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Core Activity|Used during|Many-to-Many|
|Process|Cross-reference|Many-to-Many|
|Subfunction|Cross-reference|Many-to-Many|
|Role|Audience|Many-to-Many|
|People|Audience|Many-to-Many|
|Software|Referenced|Many-to-Many|

**Document View Layout:** Same as SOP.

**Export:** Exportable as markdown in Tier 1.

**Tier 2 — Interactive Completion:** Checklist Manager as an attached app. Employees get access to their checklists, can check items off during execution. Completion is timestamped in the activity feed for the Person, the Core Activity, and the Process. Tracks who completed what and when.

---

### Tier 2 Objects

---

#### Team

A group of people working together.

**View:** Record View (three-column layout) **Map Appearance:** Grouping on Org Chart

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Team Title|Text|e.g., "Field Crew Alpha," "Office Admin Team"|
|Description|Markdown||
|Team Lead|Person reference||
|Number of People|Number|Auto-calculated|
|Location|Text|Where the team is based|
|Office|Text|Office assignment (if applicable)|
|Status|Simple lifecycle|Active / Inactive|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|People|Members|Many-to-Many|
|Role|Roles within team|Many-to-Many|
|Function|Serves|Many-to-Many|
|Subfunction|Operates within|Many-to-Many|
|Equipment|Assigned to|Many-to-Many|
|Vendor|Works with|Many-to-Many|
|Subcontractor|Works with|Many-to-Many|

**Record Layout:**

- **Left column:** Properties
- **Middle column:** Activity feed
- **Right column:** People, Roles, Functions, Subfunctions, Equipment, Vendors, Subcontractors

---

#### Template

A reusable document, form, or file used during operations. Different from an SOP (which is how-to) — a Template is a deliverable or tool.

**View:** Document View (same Notion-style layout as SOP)

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Template Title|Text|e.g., "Change Order Form," "Punch List Template"|
|Type|Select|Form / Template / Contract / Report / Checklist Template|
|Location URL|URL|Where the master version lives (Google Drive, BuilderTrend, etc.). AI may use this to access/update the template.|
|Responsible Role|Role reference|Role responsible for maintaining this template|
|Responsible Person|Person reference|Person responsible for maintaining this template|
|Version|Number||
|Last Reviewed|Date||
|Created Date|Date|Auto-generated|
|Status|Lifecycle|Draft → In Review → Published → Needs Update → Archived|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Core Activity|Used during|Many-to-Many|
|Process|Used in|Many-to-Many|
|Subfunction|Used in|Many-to-Many|
|Role (Users)|Used by|Many-to-Many (roles of people who use this template)|
|Software|Hosted in|Many-to-Many|
|Feature|Hosted in|Many-to-Many|
|Subcontractor|Used by|Many-to-Many|
|SOP|Referenced by|Many-to-Many|
|Checklist|Referenced by|Many-to-Many|

---

#### KPI (Key Performance Indicator)

A measurable metric tied to operational performance.

**View:** Record View (three-column layout)

**Properties:**

|Property|Type|Notes|
|---|---|---|
|KPI Title|Text|e.g., "Estimate Turnaround Time," "Change Order Frequency"|
|Description|Markdown|What this measures and why it matters|
|Target Value|Number|Goal|
|Unit|Text|Days, %, $, count, etc.|
|Direction|Select|Higher is Better / Lower is Better / Boolean (Yes/No) / Target Range|
|Frequency|Select|Daily / Weekly / Monthly / Quarterly|
|Calculation Method|Markdown|How to calculate this KPI|
|Status|Lifecycle|Active / Inactive / Under Development|

**Direction Logic:** Determines how the KPI is color-coded. "Lower is Better" means 0% errors = green. "Higher is Better" means 100% close rate = green. "Boolean" means Yes = green, No = red. "Target Range" means within range = green, outside = red.

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Core Activity|Measures|Many-to-Many|
|Process|Measures|Many-to-Many|
|Subfunction|Measures|Many-to-Many|
|Function|Measures|Many-to-Many|
|Role|Accountable|Many-to-Many|
|Subcontractor|Measures|Many-to-Many|

**Record Layout:**

- **Left column:** Properties
- **Middle column:** Activity feed + trend chart (Tier 2)
- **Right column:** Core Activities, Processes, Subfunctions, Functions, Roles, Subcontractors

**Tier 1:** Reference records only (define what to measure). **Tier 2:** Actual value tracking, trend charts, Scorecards view under KPIs nav.

---

#### Feature

A specific capability within a Software tool.

**View:** Record View (three-column layout)

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Feature Title|Text|e.g., "BuilderTrend Scheduling Module"|
|Description|Markdown|What this feature does|
|Parent Software|Software reference|Required|
|Required Tier/Plan|Text|What subscription level is needed to access this feature|
|Required Seat Level|Text|What seat/permission level is needed|
|Number of Users|Number|Auto-calculated from associated People/Roles|
|Status|Lifecycle|Active / Not Using / Planned|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Software|Child → Parent|Many Features → One Software|
|Core Activity|Used in|Many-to-Many|
|Process|Used in|Many-to-Many|
|Subfunction|Used in|Many-to-Many|
|Function|Used in|Many-to-Many|
|Template|Hosts|Many-to-Many|
|SOP|Referenced in|Many-to-Many|
|Checklist|Referenced in|Many-to-Many|

---

### Tier 3 Objects

---

#### Vendor

An external company providing products or services (suppliers, agencies, consultants, service providers).

**View:** Record View (three-column layout)

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Vendor Title|Text|Company name|
|Type|Select|Supplier / Agency / Consultant / Service Provider|
|Primary Contact Name|Text||
|Primary Contact Email|Email||
|Primary Contact Phone|Phone||
|Website|URL||
|Contract Status|Select|Active / Expired / Under Review / Pending|
|Renewal Date|Date||
|Contract Link|URL|Link to stored contract/agreement document|
|Deliverables|Markdown|What they provide|
|Notes|Markdown||

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Core Activity|Involved in|Many-to-Many|
|Process|Participates in|Many-to-Many|
|Function|Serves|Many-to-Many|
|Subfunction|Serves|Many-to-Many|
|Software|Provides or integrates with|Many-to-Many|
|Equipment|Services or supplies|Many-to-Many|
|Role|Interacts with|Many-to-Many|
|People|Interacts with|Many-to-Many|
|Team|Works with|Many-to-Many|
|SOP|Referenced in|Many-to-Many|
|Checklist|Referenced in|Many-to-Many|
|Template|Referenced in|Many-to-Many|

---

#### Subcontractor

An external individual or company performing specialized work. Similar to Person but external. Not limited to trade work — applicable to any industry.

**View:** Record View (three-column layout)

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Company Name|Text||
|Contact Name|Text||
|Specialty|Text|Open text field (customizable by user). e.g., Electrical, Plumbing, HVAC, Consulting, etc.|
|Email|Email||
|Primary Phone|Phone||
|License Number|Text|If applicable|
|Insurance Status|Select|Current / Expired / Pending|
|Status|Simple lifecycle|Active / Inactive / On Hold|
|Notes|Markdown||

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Core Activity|Performs|Many-to-Many|
|Process|Part of|Many-to-Many|
|Function|Serves|Many-to-Many|
|Subfunction|Serves|Many-to-Many|
|Role|Interacts with|Many-to-Many|
|People|Interacts with|Many-to-Many|
|Team|Works with|Many-to-Many|
|Equipment|Uses|Many-to-Many|
|SOP|Referenced in|Many-to-Many|
|Checklist|Referenced in|Many-to-Many|
|Template|Uses|Many-to-Many|
|KPI|Measured by|Many-to-Many|

---

#### Equipment

Physical tools, vehicles, and machinery used in operations.

**View:** Record View (three-column layout)

**Properties:**

|Property|Type|Notes|
|---|---|---|
|Equipment Title|Text|e.g., "CAT 320 Excavator," "Hilti Laser Level"|
|Type|Select|Heavy Equipment / Power Tool / Vehicle / Safety Equipment / etc.|
|Serial Number|Text||
|Purchase Date|Date||
|Cost|Currency|Purchase price|
|Depreciation Date|Date|When the asset is fully depreciated|
|Current Value|Currency|Auto-calculated or manually entered|
|Maintenance Schedule|Markdown||
|Location|Text|Where it's stored/stationed|
|Status|Simple lifecycle|Active / In Maintenance / Retired|

**Associations:**

|Associated Object|Relationship|Cardinality|
|---|---|---|
|Core Activity|Used in|Many-to-Many|
|Process|Used in|Many-to-Many|
|People|Operated by|Many-to-Many|
|Team|Assigned to|Many-to-Many|
|Vendor|Serviced by / Supplied by|Many-to-Many|
|Subcontractor|Used by|Many-to-Many|

---

## Map Specifications

### Function Chart Map

**Top-Level View:**

- All Functions displayed as large blocks
- Each Function block contains its Subfunctions as cards (similar to HubSpot deal/ticket cards on board view)
- People avatars visible on Subfunction cards
- Software icons visible on Subfunction cards
- **Toggle controls at top of view:** Show/hide People, Software, Roles
- **Hover behavior:** Hover on any Function or Subfunction to see its description as a tooltip
- Click a Function block to drill down into Function Detail view
- Click a Function title to open its record page
- Click a Subfunction card to open preview panel

**Function Detail View (drill-down):**

- Single Function displayed at top
- Subfunctions as horizontal columns
- Core Activities listed under each Subfunction column
- People avatars visible on Core Activities
- Software icons visible on Core Activities
- Role tags visible on Core Activities
- **Toggle controls at top:** Show/hide People, Software, Roles
- **Hover behavior:** Hover on any Subfunction or Core Activity to see description
- Click any Core Activity to open preview panel (slides in from right)
- Click Core Activity title to go directly to full record page

**Preview Panel Behavior (universal):** Slides in from the right. Shows stacked single-column view:

1. Properties (About section) at top — some fields editable inline
2. Recent activity (condensed)
3. Associations
4. "Open Full Record" link at top
5. Back button to return to previous view

### Workflow Map

**Visual builder/canvas.** Structured and snappy — not freeform. Elements snap into place.

- **Phases** as large horizontal sections or swim lanes. Numbered sequentially (Phase 1, Phase 2, etc.). Each Phase has a configurable title and description. Phases can have basic properties edited inline (title, description).
- **Processes** as blocks within Phases. Numbered within their Phase (1.1, 1.2, 2.1, 2.2, etc.).
- **Core Activities** as items within Process blocks.
- **Handoff Blocks** between Phases or Processes. Clearly labeled. Indicate where responsibility transfers between roles/teams/departments.
- **Status Color Coding:** Draft items appear in a distinct color. Needs Update items appear in another distinct color. Active items appear in the default/primary color. This provides immediate visual feedback on what's documented vs. what needs work.
- **Toggle controls at top:** Show/hide Roles, People, Software on Core Activities
- **Click behaviors:** Click a Core Activity → preview panel. Click Core Activity title → full record. Click a Process block → preview panel. Click Process title → full record.
- **Drag-and-drop:** Reorder Phases, Processes, and Core Activities. Snappy — shows a clear insertion line where the item will land. Plus (+) icons for adding above/below any element.
- **Inline creation:** Create new Core Activities directly from within the workflow builder without leaving the canvas. Also search and add existing Core Activities.
- **Add/remove:** Add and remove Phases, Processes, and Core Activity references.

### Org Chart

**Visual hierarchy built around Roles, not People.**

**Singular View (default):**

- Shows one instance of each Role, regardless of how many people fill it
- Count label on each Role node (e.g., "Account Manager ×10")
- Count label on Team groupings (e.g., "Sales Team ×4" if there are 4 identical sales teams)
- Roles arranged hierarchically by reporting structure
- Click a Role to see the People who fill it (expand/preview)
- Click a Role title to open its record page

**Comprehensive View (toggle):**

- Shows every individual Role instance and every Person
- Full expansion of all teams and their members
- Every node is clickable to its record page

**People View (toggle):**

- Focused on individuals rather than roles
- Shows the actual people in the organization mapped to their positions

**Toggle controls:** Switch between Singular / Comprehensive / People views. Show/hide Teams.

---

## Extensibility

The architecture supports new objects without redesigning the system. Adding a new object requires:

1. **Property schema** — Define its fields
2. **Association map** — Define which objects it connects to
3. **View type** — Record View (three-column) or Document View (markdown editor)
4. **Navigation placement** — Which nav group it belongs to
5. **List view** — Auto-generated from property schema

The object configuration interface in Settings should eventually allow admin users to create custom objects, define custom properties on existing objects, and configure association rules.

**Custom Properties:** All objects support user-defined custom properties from MVP launch. This is core to the platform's flexibility.

**Markdown Export:** Available at every level — individual Core Activity, Process, Subfunction, Function, entire Workflow, entire Function Chart. Clean, structured markdown output suitable for AI agent consumption.

---

## Resolved Design Decisions

|Decision|Resolution|
|---|---|
|Status/Lifecycle per object|Shared default (Draft → In Review → Active → Needs Update → Archived) for Function, Subfunction, Process, Core Activity, Phase. NOT customizable for these (required for map color coding). Other objects have their own defaults, customizable in Settings.|
|Core Activity → Subfunction|One primary Subfunction per Core Activity. Cross-functional visibility through Process associations.|
|Process → Core Activity ordering|Ordered list in the right-column associations panel. NOT in the middle column (which stays as activity feed). Tier 2: toggle-able mini visual flow at top of activity feed.|
|Checklist interactivity|Reference document for MVP. Tier 2: Checklist Manager app with interactive completion, timestamping, and activity feed integration.|
|KPI tracking|Reference records for MVP. Tier 2: actual value entry, trend charts, Scorecards view.|
|Inline creation on Workflow Map|Yes — create new Core Activities inline from the builder, or search/add existing ones.|
|Person vs. User|Separate concepts. Person = operational record. User = app login account. Managed separately, optionally linked.|
|Video|URL field on Core Activity with inline embed playback (no leaving the app).|
|Custom Properties|All objects support custom properties from MVP launch.|
|Markdown export|Available at every level from MVP launch.|
|Phase as object or structural element|Structural element within Workflow Map. Has configurable title and description but no record page.|
|"Name" vs. "Title"|All objects use "Title" (Function Title, Process Title, etc.) to avoid collision with First Name/Last Name on Person.|
|Preview panel|Universal pattern across all views. Slides in from right. Stacked single-column: properties → activity → associations.|
|Document View layout|Notion-style: Title → collapsible properties → markdown editor. Can open as side panel or full screen.|
|Navigation "Organization"|Changed to "Functions" to avoid confusion with Org Chart under People.|
|Ops Coach naming|"Ops Coach" (not "AI Ops Coach").|
|Industry scope|Industry-agnostic platform. Not limited to construction.|