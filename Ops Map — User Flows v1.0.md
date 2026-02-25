## Overview

This document maps the primary user journeys through Ops Map, focused on MVP (Tier 1) functionality. Each flow describes who the user is, what they're trying to accomplish, and the step-by-step path they take through the app.

User flows are organized into three categories:

1. **Setup Flows** — Getting the business into the system for the first time
2. **Building Flows** — Creating and documenting operational content
3. **Using Flows** — Day-to-day navigation, review, and management

---

## Key Users

**Owner/Operator:** The business owner or CEO. They're setting up the system, defining the organizational structure, and reviewing operational health. Their primary goals:

- Find the constraint in the business and identify what's causing it
- Understand where their next hire should be
- Evaluate software decisions (what to buy, what's redundant)
- Evaluate people and understand what they're actually doing
- Identify which areas of the business need the most attention
- They spend most of their time in the Function Chart, Workflow Map, and Dashboard.

**Operations Lead:** COO, operations manager, or office manager. They're doing the detailed documentation work. Their primary goals:

- Document SOPs, checklists, and core activities
- Structure their team and map responsibilities
- Ensure processes are complete, consistent, and followed
- They spend most of their time in Core Activity records, Document Views, and the Workflow builder.

---

## Universal Interaction Patterns

These patterns apply across all flows and should be consistent throughout the app.

### Quick-Create Pattern

All new records use a **right-panel slide-out form** (not a full record page). The panel contains only essential fields. At the bottom, two buttons:

- **Create** — Saves the record and opens it as a full record page
- **Create and Add Another** — Saves the record, stays in the current view, and opens a fresh form for the next entry

This pattern applies to creating People, Processes, Core Activities (from list view), Roles, Software, and all other objects when created from a list view or association panel.

### Preview Panel

Available everywhere. When clicking a linked record from a map view, list view, or association column, a panel slides in from the right showing a stacked single-column view: properties at top, associations below, recent activity condensed. Editable fields can be changed directly from the preview. "Open Full Record" link at the top. Close to return to previous view.

From a preview panel, users can also open Document View objects (SOPs, Checklists, Templates) in the panel itself — the panel switches to show the document editor. Users can expand to full screen or close to return to the preview.

### Back Navigation (No Breadcrumbs)

The app does NOT use breadcrumbs. Breadcrumbs would become unmanageable as users click through associations (Core Activity → Role → Person → Team → Function → ...).

Instead:

- Each record page has a **back link** to its parent object list (e.g., a Core Activity record links back to "Core Activities" list)
- Users use the **browser back button** to retrace their steps through associations
- Map views have a back link to return from drill-down to top-level (e.g., Function Detail View → Function Chart)

### Markdown Import

Available on Function Chart and Workflow Map views. Users can drop in a markdown file to bulk-create records:

- **Function Chart import:** H1 = Function, H2 or bullet = Subfunction, indented bullet = Core Activity
- **Workflow import:** H1 = Phase, H2 or bullet = Process, indented bullet = Core Activity

This allows users to prepare content in AI tools (like Claude) and import it directly. Import creates all items as Draft status. Associations (roles, software, people) are not included in markdown import for now — those are added after import.

### Ops Coach Interaction

The Ops Coach is accessible from every page via a slide-out panel from the right. Users can type or talk (voice input via speech-to-text). The Ops Coach is context-aware — it knows what page, map, or record the user is currently viewing. The Ops Coach asks proactive questions and follow-ups (up to 3 follow-up questions per interaction).

The Ops Coach may also have its own dedicated page for longer working sessions (gap analysis, mind sweeps, workflow creation by voice).

The app should be fully usable without the Ops Coach, but having it should be significantly faster and more effective.

### AI-Generated Content Labeling

When the Ops Coach or AI generates content (descriptions, SOPs, checklists, triggers, end states), the content is visually labeled as AI-generated until a user reviews and approves it. This is distinct from user-created content. There should be a clear indicator (e.g., small AI badge or label) on any property or document that was AI-drafted and hasn't been manually confirmed.

### Draft/Active Visibility Toggle

On all map views (Function Chart, Workflow Map), users can toggle visibility:

- **Show All** — see every status (Draft, In Review, Active, Needs Update, Archived)
- **Active Only** — see only Active items (clean view for training/onboarding)
- **Hide Archived** — show everything except Archived

Status colors provide instant visual feedback on documentation completeness.

---

## 1. Setup Flows

---

### Flow 1.1: First-Time Onboarding

**User:** Owner/Operator **Goal:** Set up the company and get oriented in the platform **Entry Point:** First login after account creation

**Steps:**

1. User logs in for the first time → lands on **Onboarding Welcome Screen** (not the Dashboard yet). The tone is conversational — it should feel like talking to someone, not filling out a form.
    
2. **Company Information:** "Let's get your company set up."
    
    - Company Name
    - Industry (dropdown)
    - Revenue (free text — not ranges. User types any number. AI interprets.)
    - Number of Employees (free text)
    - Number of Subcontractors (free text, if applicable to industry)
    - Brief description of what the company does
    - Key objectives (what are you working toward right now?)
    - Biggest pains right now (what problems are you trying to solve?)
    - AI processes all inputs and generates the **Company Profile** in Settings
3. **Education Moment:** Brief explanation of what's about to happen: "We're going to map your business. First, we'll show you everything your business does (the Function Chart), and then we'll help you document how you do it (Workflows). Let's start with your Functions — these are the major areas of your business. Most businesses have 6 to 12."
    
4. **Functions Setup:** A multi-select screen showing industry-specific suggested Functions. User checks the ones that apply, unchecks ones that don't, and can create custom Functions. Advice text visible: "Most businesses have 6–12 Functions. You can always add or remove these later."
    
5. **Auto-populated Subfunctions:** Based on the selected Functions, industry, company size, and AI analysis, the system auto-populates **draft Subfunctions** under each Function. The user sees them displayed and can click to keep or remove. These are all Draft status. Message: "These Subfunctions will grow and be further defined as you use Ops Map. For now, keep the ones that feel right and remove the ones that don't."
    
6. **Auto-populated Core Activities:** AI also generates example Core Activities under Subfunctions — all as Draft. This gives the user a populated demo of what their Function Chart could look like with real data.
    
7. **Roles Setup:** "Now let's set up the key Roles in your company. Remember — these are Roles, not people. Some people in your organization probably fill more than one role, especially if you're a smaller team." Industry-specific Role suggestions appear. User can accept, rename, add custom Roles, or type in new ones.
    
8. **Demo/Preview:** The system shows the user their Function Chart with the auto-populated data: Functions as blocks, Subfunctions as cards, Core Activities listed, and Roles mapped to Subfunctions. It highlights an area and walks them through: "Click into a Function to see the drill-down view." User clicks and sees the Subfunction columns with Core Activities and Role tags. This is a guided walkthrough using their actual (draft) data.
    
9. **Draft Explanation:** "Everything you see here is saved as a Draft. Nothing is Active yet. As you document and confirm each item, you'll mark it Active. Drafts appear in [draft color] so you always know what still needs work."
    
10. **Reset Option:** Prominent option: "Want to start from scratch? You can clear all auto-generated data and build your Function Chart manually. Or keep this data — it'll all be saved as Draft for you to refine." This should not be a buried setting — it should be part of the onboarding flow.
    
11. User is taken to the **Dashboard** which shows:
    
    - Onboarding progress (steps completed, steps remaining)
    - Suggested next actions: "Build your first Workflow," "Start documenting Core Activities," "Add your team members"
    - User can dismiss/close the onboarding progress if they want to skip it

**Key UX Notes:**

- One question at a time or small groups. Never a wall of form fields.
- Industry-specific suggestions dramatically reduce friction.
- The Ops Coach assists during onboarding, suggesting Functions, Subfunctions, Roles based on company info.
- All onboarding-generated content is Draft status.
- User can skip any step and return later.
- The auto-populated data with guided walkthrough is the primary way users learn how the app works — not a separate tutorial or documentation.

**Screens Touched:** Onboarding Welcome → Company Info (multi-step) → Function Selection → Subfunctions/Core Activities Preview → Roles Setup → Guided Walkthrough → Dashboard

---

### Flow 1.2: Adding People to the System

**User:** Owner/Operator or Operations Lead **Goal:** Add team members so they can be mapped to roles and tagged on core activities **Entry Point:** Dashboard suggested action, or People nav → People list view

**Steps:**

1. User navigates to **People** in left sidebar → **People** list view
2. Clicks **"Create New"** button (right side of list view header, or top bar dropdown)
3. A **quick-create panel slides in from the right side** with essential fields:
    - First Name, Last Name
    - Job Title
    - Email
    - Primary Role (dropdown of existing Roles — can type to create a new Role inline)
    - Primary Function (dropdown of existing Functions — CANNOT create new Functions from here. Info button next to field: "Functions are the major areas of your business. Try to set these once and keep them consistent.")
4. At the bottom, two buttons:
    - **Create** — saves the person and opens their full record page
    - **Create and Add Another** — saves the person, clears the form, ready for the next entry. Stays in list view with the quick-create panel open.
5. Person appears in the People list view with their avatar (profile photo or initials from first/last name)
6. Person is automatically associated with their selected Role and Function
7. From the full record page (if user clicked "Create"), they can add additional associations (teams, subfunctions, additional roles, etc.) and fill in remaining properties (phone numbers, salary, start date, etc.)

**Key UX Notes:**

- Most associations do NOT need to be on the quick-create form. Keep it fast and minimal.
- The "Create and Add Another" flow is essential for batch entry.
- When typing in the Primary Role field, if the role doesn't exist, user can create one inline ("Create Role: [name]"). This does NOT apply to Functions — Functions should be set up intentionally, not created casually.
- People export: Each Person can be exported as an individual markdown file (all properties + associations). Bulk export creates a folder of markdown files, one per person. This supports AI workflows.

**Screens Touched:** People List View → Quick-Create Panel → (optionally) Person Record

---

### Flow 1.3: Setting Up the Function Chart

**User:** Owner/Operator **Goal:** Build out the full organizational structure **Entry Point:** Functions nav → Function Chart, or post-onboarding

**Steps:**

1. User navigates to **Functions** → **Function Chart**
2. Sees the Functions created during onboarding as large block columns. May need to scroll left/right to see all Functions.
3. **To add a Function:** Clicks "+" button at the end of the column row → creates a new Function block → names it
4. **To add a Subfunction:** Clicks "+" button at the top or bottom of a Function block → creates a new Subfunction card at the bottom → names it. Both add to the bottom; user can drag to reorder.
5. **To reorder Functions:** Drag Function blocks left/right. Can also sort alphabetically (A→Z or Z→A) via a sort control.
6. **To reorder Subfunctions within a Function:** Drag Subfunction cards up/down within the Function block.
7. **To add detail to a Subfunction:** Clicks the Subfunction card → **Preview Panel** slides in → user can edit description, add owner, tag Roles and People.
8. **Inline tagging on hover:** When hovering over a Subfunction card, an "Add Associations" button appears. Clicking it opens a panel where the user can tag People, Roles, Software, Features directly without opening the full record.
9. **To drill down into a Function:** Clicks the Function block header → enters **Function Detail View** which looks exactly like the Function Chart but for a single Function. Subfunctions are columns, Core Activities are listed under each column.
10. **In the drill-down view:** User can drag-and-drop Core Activities to reorder them within a Subfunction, or move them between Subfunctions. Can add Core Activities at the top or bottom of a Subfunction column.
11. **Markdown Import:** An import option (button or drag-drop zone) allows users to upload a markdown file. The file is parsed and auto-creates Functions, Subfunctions, and/or Core Activities. All created as Draft. Import can be scoped to a single Function, a single Subfunction, or the entire chart.

**Key UX Notes:**

- The Function Chart should feel productive even when mostly empty. Visual placeholders prompt: "Add Core Activities to this Subfunction."
- Inline tagging from the map view (without opening a full record) is a key interaction for rapid setup.
- The drill-down view is structurally identical to the top-level chart — just scoped to one Function. Same interaction patterns apply.
- **Markdown import** is a high-priority feature. Users working with AI tools (Claude, ChatGPT) should be able to generate markdown files and drop them in to populate their chart. This dramatically reduces manual data entry.
- **Future vision (post-MVP):** Voice input via the Ops Coach. User talks through their function chart changes, and the AI makes them in real-time. The markdown-native architecture supports this — AI reads/writes markdown, system renders it. Eventually a CLI layer could also enable AI agents to operate within the app.

**Screens Touched:** Function Chart (top-level) → Function Detail View → Preview Panel → (optionally) Markdown Import dialog

---

## 2. Building Flows

---

### Flow 2.1: Building a New Workflow

**User:** Owner/Operator or Operations Lead **Goal:** Create a workflow that maps a business process from start to finish **Entry Point:** Workflows nav → All Workflows → Create New, OR Markdown Import, OR Ops Coach voice session

**Path A — Manual Build:**

1. User navigates to **Workflows** → **All Workflows**
2. Clicks **"Create New Workflow"**
3. Quick-create panel: enters Workflow Title (e.g., "Client Journey — Residential Remodel"), Description
4. Lands on the **Workflow Map builder** (empty canvas with structure)
5. Prompted: "Add your first Phase." User types a Phase title (e.g., "Phase 1: Sales"). Can add a Phase description.
6. Prompted: "Add a Process to this Phase." User types a Process title (e.g., "Lead Qualification"). Process is numbered 1.1.
7. Inside the Process block, user adds Core Activities:
    - **Create new:** Types a Core Activity title directly (must start with action verb). A new Core Activity record is created as Draft and placed in the Process.
    - **Add existing:** Searches for an existing Core Activity by name → adds it to the Process. The Core Activity now appears in this Workflow AND retains all its other associations.
8. User continues adding Core Activities, Processes, Phases
9. Adds **Handoff Blocks** between Phases to indicate responsibility transfer (e.g., "Handoff: Sales → Project Management")
10. Items default to **Draft status** and appear in draft color. User changes status to Active as documentation is completed.
11. User can also add empty Processes (no Core Activities yet) as placeholders.
12. Saves. Workflow appears in All Workflows list.

**Path B — Markdown Import:**

1. From All Workflows or from the Workflow builder, user clicks **"Import from Markdown"**
2. Uploads or pastes a markdown file structured as: H1 = Phase, H2/bullet = Process, indented bullet = Core Activity
3. System parses the file and creates the Workflow with all Phases, Processes, and Core Activities. All Draft status.
4. User reviews, reorders, removes items with "X" button, edits titles, and refines.
5. Saves.

**Path C — Ops Coach Voice Session:**

1. User opens the Ops Coach (or goes to Ops Coach dedicated page)
2. Clicks the microphone icon and starts talking through the workflow from start to finish — describing phases, what happens, who does what, handoffs, etc.
3. Stops recording. Speech-to-text converts the audio. AI processes the transcript.
4. AI generates a draft Workflow with Phases, Processes, and Core Activities. Also drafts Core Activity properties (description, trigger, end state) based on what was said.
5. AI asks **up to 3 follow-up questions** to fill gaps: "You mentioned permits — who handles that? What triggers the permit process?"
6. User answers (typing or voice).
7. AI offers: "I noticed some gaps in your workflow. Want me to add draft items for areas that seem missing?" Performs a gap analysis and adds Draft Core Activities/Processes where it sees holes.
8. User reviews the generated workflow. Can edit, remove (X button), reorder, accept.
9. Clicks **"Accept"** → workflow goes live (all as Draft status, user marks Active as they confirm).
10. AI suggests Subfunctions for each Core Activity: "I'd suggest putting 'Send preliminary estimate' in the 'Estimating' subfunction. Does that sound right?" User can accept or reassign.

**Validation Rule:** A Core Activity must have a primary Subfunction assigned to change from Draft to Active status. It can exist as Draft without a Subfunction (allowing it to be created in a workflow before being mapped to the function chart).

**Key UX Notes:**

- Three paths to create workflows (manual, import, voice) — all produce the same result and can be combined.
- **Keyboard shortcuts:** Enter = add next item. Tab = indent/nest. Delete/Backspace on empty = remove.
- Numbering auto-updates as items are reordered (1.1, 1.2, 2.1, etc.).
- Inline creation only captures title. All other properties are added by clicking into the Core Activity later.
- Pre-built industry workflow templates available as starting points.

**Screens Touched:** All Workflows List → Workflow Map Builder → (optionally) Ops Coach Panel/Page → Markdown Import Dialog

---

### Flow 2.2: Documenting a Core Activity

**User:** Operations Lead **Goal:** Fully document a single Core Activity with all relevant detail **Entry Point:** From Workflow Map (click a Core Activity), Core Activities list view, or Function Chart drill-down

**Steps:**

1. User arrives at the **Core Activity record page** (three-column layout)
    
2. **Left column — fills in properties:**
    
    - **Title:** Already set (from workflow builder or list creation). Must start with an action verb.
    - **Description:** User types, pastes, or uses voice input (records a voice note → AI transcribes and cleans it up → user reviews and edits the AI-improved version)
    - **Trigger:** Types or has AI suggest it based on the title and description
    - **End State:** Types or has AI suggest it
    - **Video:** Pastes a Loom, YouTube, Vimeo, or Google Drive URL → video embeds inline and plays without leaving the app
    - **Status:** Currently Draft
3. **Right column — sets associations:**
    
    - **Subfunction:** Selects primary Subfunction (required to move to Active)
    - **Roles:** Tags the Role(s) responsible
    - **People:** Optionally tags specific people
    - **Software:** Tags the software used. When a Software is added, the **Ops Coach can auto-find the feature list** for that software and add Features automatically (user reviews and keeps/removes)
    - **Features:** Tags specific features within that software
    - **Equipment, Vendors, Subcontractors:** Tags as applicable
4. **Creates an SOP from the record:**
    
    - In the right column, under SOPs association, clicks **"Create New SOP"**
    - A **Document View panel** slides in from the right (1/3 to 1/2 of screen)
    - User can:
        - **Write** the SOP in the markdown editor
        - **Paste** an existing SOP from another source
        - **Talk to the Ops Coach:** Describes how the activity is performed step by step. AI asks up to 3 follow-up questions. AI generates the SOP draft. User reviews and edits.
    - Properties (title, status) visible above the editor. Auto-linked to this Core Activity.
    - User can expand to full screen for longer SOPs, or collapse back to the panel.
    - Saves → SOP is associated with the Core Activity. Labeled as AI-generated if the Ops Coach drafted it (until user confirms).
5. **Creates a Checklist from the record:**
    
    - Same panel pattern as SOP. Clicks **"Create New Checklist"** in the right column.
    - Document View panel opens.
    - Checklist rules enforced:
        - Maximum 10 items (guidance, not hard block — with a warning if exceeded)
        - Each item must start with an action verb
        - Plain language
        - Checklist has its own Trigger and End State
    - User can:
        - **Write** items in the markdown editor
        - **Paste** a list from an email or doc (line breaks auto-create separate items)
        - **Talk to AI:** Describes what needs to happen, AI generates the checklist draft with follow-up questions
    - Saves → Checklist is associated with the Core Activity
6. User changes status from Draft → Active (only possible if a primary Subfunction is assigned)
    
7. The Core Activity now appears as Active on any Workflow Map or Function Chart. User can also save as Draft and return later — Draft items appear in draft color on all maps.
    

**Key UX Notes:**

- The side panel for SOP/Checklist creation is critical — user never leaves the Core Activity context.
- Voice input is a major feature: describe the activity, AI drafts the documentation. This dramatically lowers the effort of documentation.
- AI-generated content is visually labeled until human-confirmed. Users should always know when AI created something vs. when a person did.
- Video embed supports Loom, YouTube, Vimeo, and Google Drive URLs with inline playback.
- When adding Software, the Ops Coach can proactively fetch the software's feature list and auto-populate Feature records. User reviews which to keep.

**Screens Touched:** Core Activity Record → SOP Document View (side panel) → Checklist Document View (side panel) → (optionally) Ops Coach Panel

---

### Flow 2.3: Documenting Core Activities in Bulk (from Function Chart)

**User:** Operations Lead **Goal:** Systematically document all Core Activities for a Subfunction **Entry Point:** Functions nav → Function Chart → drill into a Function → select a Subfunction

**Steps:**

1. User navigates to **Function Chart** → clicks into a Function (e.g., "Sales")
2. **Function Detail View** opens: Subfunctions as columns, Core Activities under each
3. User clicks on a Subfunction column header or card (e.g., "Lead Management")
4. **Preview Panel** slides in, showing the Subfunction's properties and associations — including its Core Activities
5. User sees Core Activities listed with their status colors (Draft items in draft color, Active in default)
6. User clicks **"Add Core Activity"** → can create new (types title) or add existing (search)
7. For each Draft Core Activity, user clicks it → Preview Panel switches to show the Core Activity → user can edit properties and create SOPs/Checklists from the panel
8. Alternatively, user clicks "Open Full Record" to go to the full three-column record page. Back link returns to Core Activities list. Browser back button returns to Function Detail View.
9. User works through each Core Activity, documenting them one by one
10. As each is completed and marked Active, the Function Detail View updates in real time — status colors change, progress is visible

**Note on AI-drafted content:** When using the Ops Coach to build a Workflow via voice (Flow 2.1, Path C), the AI also drafts Core Activity properties (description, trigger, end state). These appear on the Core Activity records as AI-generated content, labeled accordingly. When the user reaches this bulk documentation flow, some properties may already be drafted by the AI — the user reviews, edits, and confirms them.

**Key UX Notes:**

- The Function Chart drill-down is a natural "work queue" — status colors show exactly what needs attention.
- Progress is visible at the Subfunction level through color coding and auto-calculated property counts (e.g., "8 of 12 Active").
- Back navigation: from a Core Activity record, the back link goes to Core Activities list. Browser back returns to the Function Detail View.

**Screens Touched:** Function Chart → Function Detail View → Preview Panel → Core Activity Record

---

### Flow 2.4: Building a Process and Adding It to a Workflow

**User:** Operations Lead **Goal:** Create a standalone Process and then place it into one or more Workflows **Entry Point:** Workflows nav → Processes list view

**Steps:**

1. User navigates to **Workflows** → **Processes**
2. Clicks **"Create New Process"**
3. **Quick-create panel slides in from the right** with essential fields: Process Title, Description, Owner (Role), Owner (Person), Trigger, End State
4. At the bottom: **Create** (opens full record) or **Create and Add Another** (saves and clears form)
5. If user clicks Create, the full Process record opens (three-column layout)
6. **Right column:** Adds Core Activities in order:
    - Clicks "Add Core Activity" → searches existing (checkbox to select multiple) or creates new
    - Core Activities appear as an ordered list in the association panel
    - Drags to reorder if needed
7. Tags additional associations at the bottom of the right column: Subfunctions, Software, Roles, Teams
8. Saves the Process
9. **Adding to a Workflow:**
    - Navigates to **Workflows** → opens the relevant Workflow Map
    - In the builder, clicks "+" to add a Process to a Phase
    - Searches for the existing Process → selects it
    - The Process block appears in the Workflow with all its Core Activities already populated
10. Empty Processes (no Core Activities) can also be added to Workflows as placeholders
11. The same Process can be added to multiple Workflows

**Key UX Notes:**

- This is the "bottom-up" approach (build Process first, slot into Workflows). Flow 2.1 is "top-down" (build Workflow, create Processes inline). Both supported.
- When adding existing Core Activities, user can checkbox multiple and add them all at once.
- Adding an existing Process to a Workflow brings its Core Activities with it.

**Screens Touched:** Processes List View → Quick-Create Panel → Process Record → Workflow Map Builder

---

## 3. Using Flows

---

### Flow 3.1: Reviewing Operational Health

**User:** Owner/Operator **Goal:** Understand where operations stand — where to further map, document, and improve **Entry Point:** Home/Dashboard

**Steps:**

1. User opens the app → lands on **Dashboard**
2. Dashboard shows:
    - **Status summary cards:** Total Core Activities (Active, Draft, Needs Update). Total Processes (Active, Draft, Empty — where "empty" means no Core Activities or no Active Core Activities). Similar for Functions and Subfunctions.
    - **Key metrics:** Number of People, number of Roles, total Software spend, total People spend (payroll), total Equipment spend
    - **Recent activity:** Last 10 changes across the system (who changed what, when)
    - **Suggested actions:** "5 Core Activities need review," "Lead Management Subfunction has 3 undocumented activities," "Estimating Process has no active SOPs"
    - **Questions to answer:** A list of AI-generated questions the user can click and answer to fill gaps. E.g., "Who is responsible for sending the final estimate to the client?" — user clicks, answers (type or voice), and the AI updates the relevant Core Activity with the Role/Person. This is a guided way to fill in missing data without navigating to each record.
    - **Ops Coach prompts:** Suggested AI interactions: "Run a gap analysis on your Project Setup workflow," "Review software redundancy," "Identify your biggest documentation gaps"
3. User sees that "Field Operations" Function has the most Draft Core Activities
4. Clicks through (every number links to a filtered list view) → navigates to the Function Chart or Core Activities list filtered by Function
5. Decides to assign work or starts documenting

**Key UX Notes:**

- Dashboard answers: "Where could I further map out the organization and improve?" Not urgent-attention items (no real-time field data), but operational documentation health.
- Every number/metric is clickable → opens filtered list view.
- The "Questions to Answer" feature is a key differentiator: the AI identifies gaps and presents them as simple questions. User answers, AI fills in the data. This is far lower friction than manually finding and editing records.
- **Onboarding progress** persists on the Dashboard until initial setup is complete. User can dismiss it.
- **Future (post-MVP):** Mind Sweep feature — AI gives user a trigger list, user talks through their pains and frustrations, AI maps them to constraints in the business and identifies sources, asking follow-up questions to dig deeper.

**Screens Touched:** Dashboard → (various filtered views via clickable metrics)

---

### Flow 3.2: Finding and Updating a Core Activity

**User:** Operations Lead **Goal:** Find a specific Core Activity and update it **Entry Point:** Global Search, Core Activities list view, or Workflow/Function Chart Map

**Path A — Global Search:**

1. User clicks **Global Search** in top bar
2. Types "BuilderTrend" → results show Core Activities, Software records, and any objects mentioning BuilderTrend, grouped by object type
3. Clicks "Add project to BuilderTrend" Core Activity
4. Record opens → makes changes → saves

**Path B — List View with Filters:**

1. Navigates to **Core Activities** in left sidebar
2. List view opens showing all Core Activities
3. Filters by Software = "BuilderTrend" → list narrows
4. Clicks the record → opens → edits → saves

**Path C — From Workflow Map:**

1. Opens the relevant Workflow Map
2. Finds the Core Activity visually on the map
3. Clicks it → **Preview Panel** slides in → can make edits directly in the preview, OR clicks "Open Full Record"
4. Makes changes → saves
5. Closes preview panel or clicks browser back to return to Workflow

**Path D — From Function Chart:**

1. Drills into a Function → finds the Core Activity in a Subfunction column
2. Clicks it → Preview Panel → edits or opens full record

**Key UX Notes:**

- All paths lead to the same Core Activity record. Changes reflect everywhere instantly.
- Global Search is fastest for known items.
- List View with filters is the power-user path for browsing and bulk operations.
- Map views (Workflow and Function Chart) are the contextual path.
- Edits from the Preview Panel are saved immediately — no need to open the full record for quick changes.

**Screens Touched:** Global Search / Core Activities List / Workflow Map / Function Chart → Core Activity Record or Preview Panel

---

### Flow 3.3: Viewing a Workflow

**User:** Owner/Operator, new employee, or anyone needing to understand a process **Goal:** See a complete workflow from start to finish and understand the steps **Entry Point:** Workflows nav → All Workflows

**Steps:**

1. User navigates to **Workflows** → **All Workflows**
2. Sees a list of all Workflows with: title, status, number of phases, number of processes, number of core activities, last modified
3. Clicks "Client Journey — Residential Remodel"
4. **Workflow Map** opens showing the full visual flow: Phases as swim lanes, Processes as blocks, Core Activities as items, Handoff blocks between phases
5. **Toggle controls at top:** User toggles on Roles → sees role tags on each Core Activity. Toggles on Software → sees software icons. Can have multiple toggles active simultaneously.
6. User hovers over a Core Activity → sees its description in a tooltip
7. User clicks a Core Activity → **Preview Panel** slides in → shows all properties, associations, linked SOPs (clickable to read), linked Checklists (clickable to read), who's responsible
8. Closes preview → continues reviewing
9. **Status visibility:** Toggle to "Active Only" to see a clean workflow (for new employee training). Toggle to "Show All" to see drafts, needs update, etc. (for the owner reviewing documentation gaps). "Hide Archived" to exclude retired items.

**Key UX Notes:**

- This is the primary flow for new employee onboarding: "Here's how we do things."
- The Workflow Map must be clean, readable, and self-explanatory for first-time viewers.
- Toggle controls are prominent and intuitive.
- Status color coding helps experienced users spot gaps instantly.
- SOPs and Checklists are readable directly from the Preview Panel without navigating away.

**Screens Touched:** All Workflows List → Workflow Map → Preview Panel

---

### Flow 3.4: Understanding Who Does What (Function Chart Navigation)

**User:** Owner/Operator or new employee **Goal:** See the organizational structure and understand responsibilities **Entry Point:** Functions nav → Function Chart

**Steps:**

1. User navigates to **Functions** → **Function Chart**
2. **Top-level view:** Functions as large block columns (scroll left/right if needed). Subfunction cards inside each Function.
3. Toggle controls at top: People, Software, Roles — turn on/off to see avatars, icons, tags on Subfunction cards.
4. **Filter controls:** Filter by Software (show only Subfunctions/Core Activities that use a specific tool), filter by Person (show where a specific person works), filter by Role. Filters apply across the entire chart.
5. Hover any Subfunction card → see its description tooltip.
6. Click into the **Sales** Function → **Function Detail View** opens: Subfunctions as columns, Core Activities listed under each.
7. Same toggle and filter controls available in the drill-down view.
8. Click a Core Activity → Preview Panel slides in → view all properties, SOPs, checklists, associations. Can edit from the preview.
9. Click a Subfunction card/header → Preview Panel shows Subfunction details and associations.
10. From the preview panel, can click into an SOP or Checklist → panel switches to document view → can read and even edit directly.
11. User notices "Proposal Development" has several Draft Core Activities (visible by color) → can leave a note in the activity feed of the Subfunction (with a date/tag for follow-up), or start documenting immediately.

**Key UX Notes:**

- The Function Chart filter controls (by Software, Person, Role) are powerful for analysis: "Show me everything that uses BuilderTrend" or "Show me everything Sarah touches."
- Preview Panel enables deep inspection without leaving the map.
- Notes/comments in the activity feed serve as reminders and task tracking. Future consideration: bookmarking, pinning, or adding items to a personal queue for follow-up.

**Screens Touched:** Function Chart (top-level) → Function Detail View → Preview Panel → (optionally) Document View in panel

---

### Flow 3.5: Cross-Referencing — "Where Does This Role Touch?"

**User:** Owner/Operator **Goal:** Understand the full scope of a Role across the business **Entry Point:** People nav → Roles list view

**Steps:**

1. Navigates to **People** → **Roles**
2. Finds "Project Manager" in the list → clicks to open
3. **Role record page** opens (three-column layout)
4. **Left column:** Role Title, Brief Description, Job Description (expandable), Primary Function, Status, Number of People (3), Last Hired date
5. **Right column — associations:**
    - People: Sarah Chen, Mike Rodriguez, James Park
    - Core Activities: 34 tagged
    - Processes (Owns): Project Setup, Project Execution, Closeout
    - Processes (Involved In): Change Order Processing, Client Communication
    - Subfunctions: Project Setup, Execution, Closeout, Quality Control
    - KPIs: Project On-Time Delivery Rate, Client Satisfaction Score
6. User clicks "34 Core Activities" → opens **Core Activities list view** pre-filtered to this Role
7. From the filtered list, user can further sort/filter by Subfunction, Process, Status, or remove the filter to see all Core Activities

**Key UX Notes:**

- This answers: "If our PM quits, what's affected?" — critical for risk management and cross-training.
- Same pattern works for any object: Software → everywhere it's used. Subfunction → everything in it. Person → everything they touch.
- Association counts that link to filtered list views are a core interaction pattern throughout the app.

**Screens Touched:** Roles List View → Role Record → Core Activities List View (filtered)

---

### Flow 3.6: Editing from List View and Map Views (Inline Editing)

**User:** Operations Lead **Goal:** Quickly update properties across multiple records without opening each one **Entry Point:** Core Activities list view, Workflow Map, or Function Chart

**Path A — List View Inline Editing:**

1. User navigates to **Core Activities** list view
2. Filters by Subfunction = "Lead Management," Status = "Draft"
3. Sees 6 Core Activities that need work
4. Clicks the **Role** column cell on a row → dropdown appears → selects "Sales Rep" → saved inline
5. Clicks the **Software** column cell → dropdown → selects "HubSpot" → saved
6. Clicks the **Status** column cell → dropdown → changes to "In Review" → saved
7. For people-specific fields (email, phone), clicking opens a formatted input box (not raw inline text) that validates the entry
8. For items needing detailed editing, clicks the row title → full record opens

**Path B — From Map Views:**

1. User is on the **Workflow Map** or **Function Chart**
2. Toggles to show only Draft items (or filters by a specific status)
3. Clicks a Draft Core Activity → **Preview Panel** slides in
4. Edits properties directly in the preview panel (role, software, status, description)
5. Saves → map updates in real time with new status color
6. Closes panel → clicks the next Draft item → repeats

**Key UX Notes:**

- Inline editing on list views works for: select/dropdown fields, status, reference fields (Role, Software, Person), and simple text fields. Markdown fields (Description, SOP content) open the full record.
- On list views, field-specific edit controls ensure data quality (phone numbers get a formatted input, not raw text).
- Changes made anywhere (list view, preview panel, full record) reflect immediately across all views.
- Map view editing via Preview Panel is especially powerful for working through documentation systematically.

**Screens Touched:** Core Activities List View / Workflow Map / Function Chart → Preview Panel → (optionally) Core Activity Record

---

### Flow 3.7: Exporting Content

**User:** Owner/Operator or Operations Lead **Goal:** Export content for external sharing, AI agent use, or backup **Entry Point:** Any record page or map view

**Markdown Export (available everywhere):**

1. On any record page or map view, user clicks **Export button** (consistently placed, top right area)
2. Selects "Export as Markdown"
3. System generates structured markdown:
    - **Core Activity export:** Title, description, trigger, end state, roles, people, software, checklist items, SOP content, all associations
    - **Process export:** Title, description, trigger, end state, role owner, person owner, plus all Core Activities with their full details
    - **Subfunction export:** Title, description, all Core Activities within it
    - **Function export:** Title, description, all Subfunctions and their Core Activities
    - **Workflow export:** Title, description, each Phase (title, description), each Process (title, trigger, end state, owners), each Core Activity (full details), handoff labels
    - **Function Chart export:** All Functions, all Subfunctions, all Core Activities
    - **People export:** Individual person (all properties + associations) or bulk export (folder of markdown files, one per person)
4. Downloaded as file or copied to clipboard

**PDF Export (maps only):**

1. On **Workflow Map** view: Export as PDF → vertical/portrait orientation. Visual representation of the full workflow.
2. On **Function Chart** view: Export as PDF → landscape orientation. Visual representation of the org structure.
3. PDFs are image-style exports — for printing or sharing with people who don't have app access.

**Key UX Notes:**

- Export button is consistently placed across all record pages and map views.
- Markdown export is the primary format — clean, hierarchical, and immediately usable by AI agents.
- PDF export is only for map views (Workflow and Function Chart), not for individual records.
- "Copy to Clipboard" option available for quick pasting.
- Markdown output should be structured enough that it can be re-imported into Ops Map (round-trip capability).

**Screens Touched:** Any record/map → Export dialog → Downloaded file

---

### Flow 3.8: Using the Ops Coach

**User:** Any user **Goal:** Get help building, documenting, or improving operations **Entry Point:** Ops Coach icon in top bar (slide-out panel), or Ops Coach dedicated page

**Slide-Out Panel Mode:**

1. User clicks the **Ops Coach** icon in the top bar
2. A chat panel slides out from the right side
3. User can **type** or **talk** (microphone icon for voice input)
4. The Ops Coach is **context-aware** — knows what page, record, or map the user is viewing
5. Example interactions:
    - On a Workflow Map: "What processes am I missing in this workflow?"
    - On a Core Activity: "Draft an SOP for this activity"
    - On a Function Chart: "Which subfunctions have the most undocumented activities?"
    - On the Dashboard: "Run a gap analysis on my Field Operations function"
    - General: "Help me build a workflow for our change order process"
6. When the Ops Coach generates content:
    - **Draft SOP/Checklist:** Opens in a Document View panel for review. Labeled as AI-generated.
    - **Draft Workflow:** Opens in the Workflow builder. All items Draft status.
    - **Property suggestions:** Shows suggested text for description, trigger, end state. User accepts or edits.
    - **Feature list for software:** Auto-populates Features for a newly added Software record.
7. The Ops Coach **asks proactive questions** — not just responding to user input, but surfacing things it notices: "I see your Estimating function has no active SOPs. Want me to help draft some?"

**Dedicated Page Mode:**

1. User navigates to an Ops Coach page (accessible from nav or a prominent link)
2. A full-page working environment for longer AI sessions:
    - Building entire workflows via voice
    - Doing comprehensive gap analysis
    - Running a mind sweep (future): AI provides a trigger list, user talks through pains, AI maps to constraints and operational improvements
3. Results from the dedicated page create records in the system just like the slide-out panel does

**Key UX Notes:**

- The Ops Coach is visible/accessible on every page. It should feel like a built-in assistant, not a separate feature.
- Voice input is a primary interaction mode, not an afterthought. Many construction company owners are more comfortable talking than typing.
- Context-awareness is critical — the Ops Coach should never ask "which workflow?" when the user already has one open.
- AI-generated content always labeled until human-confirmed.
- The app is fully functional without the Ops Coach — but dramatically faster and more effective with it.

**Screens Touched:** Any screen → Ops Coach Panel (overlay), OR Ops Coach Dedicated Page

---

## Navigation Summary

### Back Navigation Pattern

|Current View|Back Link Goes To|
|---|---|
|Core Activity Record|Core Activities list view|
|Process Record|Processes list view|
|Person Record|People list view|
|Role Record|Roles list view|
|Any other Record|That object's list view|
|Function Detail View (drill-down)|Function Chart (top-level)|
|Workflow Map|All Workflows list|
|Any view reached via association click|Use browser back button to retrace|

### Cross-Object Navigation

Every association in the right column of a record is clickable. Users naturally traverse the object graph: Core Activity → Role → Person → Team → Function. Each click opens the new record. The back link on each record goes to that object's list view. Browser back retraces the association path.

---

## Screen Inventory for Wireframing

Based on all flows, the following unique screen types need wireframes:

|#|Screen|Type|Notes|
|---|---|---|---|
|1|**Dashboard / Home**|Unique|Status cards, metrics, recent activity, suggested actions, questions to answer, Ops Coach prompts, onboarding progress|
|2|**Onboarding Wizard**|Unique|Multi-step guided setup (company info, functions, subfunctions, roles, guided walkthrough, demo data)|
|3|**Function Chart — Top Level**|Map|Functions as block columns, Subfunction cards inside, toggle/filter controls, inline tagging|
|4|**Function Chart — Function Detail**|Map|Single Function drill-down, Subfunctions as columns, Core Activities listed, toggle/filter controls|
|5|**Workflow Map — Builder/Viewer**|Map|Phases, Processes, Core Activities, Handoff blocks, drag-and-drop, inline creation, toggle controls, status colors, keyboard shortcuts|
|6|**Org Chart**|Map|Singular/Comprehensive/People view toggles, Role nodes with count labels, Team groupings|
|7|**List View**|Generic (all objects)|Filterable, sortable, searchable table. Inline editing. Column customization. HubSpot-style.|
|8|**Record View — Three Column**|Generic (most objects)|Left: properties. Middle: activity feed. Right: associations.|
|9|**Document View**|Generic (SOP, Checklist, Template)|Notion-style: title → collapsible properties → markdown editor. Full-screen and side-panel variants.|
|10|**Preview Panel**|Generic (overlay)|Slides in from right. Stacked single-column. Editable. Used everywhere.|
|11|**Quick-Create Panel**|Generic (overlay)|Slides in from right. Essential fields only. Create / Create and Add Another.|
|12|**Global Search Results**|Unique|Search across all objects, grouped by type|
|13|**Markdown Import Dialog**|Unique|Upload/paste markdown, preview parsed structure, confirm import|
|14|**Ops Coach — Slide-Out Panel**|Unique|Chat + voice, context-aware, content generation|
|15|**Ops Coach — Dedicated Page**|Unique|Full-page working environment for longer sessions|
|16|**Settings — Company Profile**|Settings|Company info, objectives, pains, description|
|17|**Settings — Object Configuration**|Settings|Custom properties, status customization, association visibility|
|18|**Export Dialog**|Generic|Markdown and PDF options, preview, download/clipboard|

**18 unique screen types total.** Of these, 4 are generic/reusable (List View, Record View, Document View, Preview Panel + Quick-Create), 4 are map views, 3 are settings/dialogs, and 7 are unique screens.