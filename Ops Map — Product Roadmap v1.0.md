## Overview

This document captures the complete product vision for Ops Map, organized into development phases. The MVP Specification (separate document) defines what ships first. Everything in this roadmap is the full vision — features, objects, AI capabilities, and platform evolution organized by priority and dependency.

---

## Phase Summary

|Phase|Focus|Key Deliverables|
|---|---|---|
|**MVP**|Core platform|7 objects, Function Chart, Workflow Map, manual creation, markdown export|
|**Phase 2**|Content & Import|Markdown import, SOP/Checklist/Template objects, Document View|
|**Phase 3**|AI Foundation|Ops Coach (basic), voice input, AI content generation|
|**Phase 4**|Org & Metrics|Team, KPI, Feature objects, Org Chart, Scorecards, Dashboard enhancements|
|**Phase 5**|External & Equipment|Vendor, Subcontractor, Equipment objects, PDF export|
|**Phase 6**|Advanced AI|AI onboarding wizard, gap analysis, mind sweep, voice-to-workflow, software feature auto-detection|
|**Phase 7**|Agent Platform|Agent API (read/write), CLI, real-time agent access, checklist manager app|

---

## MVP (Defined in Separate Spec)

**Objects:** Function, Subfunction, Process, Core Activity, Person, Role, Software

**Maps:** Function Chart (top-level + drill-down), Workflow Map (builder/viewer)

**Views:** List View, Record View (three-column), Preview Panel, Quick-Create Panel

**Features:** Manual creation, markdown export, global search, basic dashboard, custom properties, settings/configuration

**Architecture:** Relational database, extensible object model, agent-ready API foundation (internal only), breadcrumb navigation within map contexts

---

## Phase 2: Content & Import

**Goal:** Enable faster data entry and introduce document management.

### Markdown Import

- Import button on Function Chart and Workflow Map views
- Upload or paste a markdown file
- Parser interprets structure:
    - **Function Chart:** H1 = Function, H2/bullet = Subfunction, indented bullet = Core Activity
    - **Workflow:** H1 = Phase, H2/bullet = Process, indented bullet = Core Activity
- Import can be scoped: entire chart, single function, single subfunction, entire workflow
- Preview parsed structure before confirming import
- All imported items created as Draft status
- Associations (roles, software, people) are NOT included in import — added manually after
- Round-trip capability: exported markdown can be re-imported
- Users can generate markdown files in external AI tools (Claude, ChatGPT) and import them directly

### New Objects: SOP, Checklist, Template

**SOP (Standard Operating Procedure)**

|Property|Type|Notes|
|---|---|---|
|SOP Title|Text||
|Content|Markdown|Primary editing surface|
|Trigger|Markdown||
|End State|Markdown||
|Version|Number|Auto-incremented on publish|
|Last Reviewed|Date||
|Status|Lifecycle|Draft → In Review → Published → Needs Update → Archived|

Associations: Core Activity (M:M), Process (M:M), Subfunction (M:M), Function (M:M), Role (M:M), People (M:M), Software (M:M), Vendor (when available, M:M), Subcontractor (when available, M:M)

**Checklist**

|Property|Type|Notes|
|---|---|---|
|Checklist Title|Text||
|Content|Markdown|Ordered items. Max 10 items guidance (warning, not hard block). Each item starts with action verb. Plain language.|
|Trigger|Markdown||
|End State|Markdown||
|Version|Number||
|Last Reviewed|Date||
|Status|Lifecycle|Draft → In Review → Published → Needs Update → Archived|

Associations: Core Activity (M:M), Process (M:M), Subfunction (M:M), Role (M:M), People (M:M), Software (M:M)

**Template**

|Property|Type|Notes|
|---|---|---|
|Template Title|Text||
|Content|Markdown||
|Type|Select|Form / Template / Contract / Report / Checklist Template|
|Location URL|URL|Where master version lives externally|
|Responsible Role|Role reference||
|Responsible Person|Person reference||
|Version|Number||
|Last Reviewed|Date||
|Status|Lifecycle|Draft → In Review → Published → Needs Update → Archived|

Associations: Core Activity (M:M), Process (M:M), Subfunction (M:M), Role (M:M), Software (M:M), Subcontractor (when available, M:M), SOP (M:M), Checklist (M:M)

### Document View

New view type for SOP, Checklist, Template. Notion-style layout:

- Title at top
- Properties below title (collapsible section)
- Markdown editor as main content area (full width)
- Can open as side panel (1/3 to 1/2 of screen) when accessed from association links
- Expand to full screen option
- Collapse properties to maximize editor space
- Paste support: paste a list with line breaks → auto-creates checklist items

### Navigation Updates

- Add **Documents** nav group to left sidebar (SOPs, Checklists, Templates)
- Document objects appear in association columns across existing objects

### Updated Associations

Core Activity gains associations to: SOP (M:M), Checklist (M:M), Template (M:M) Process, Subfunction, Function gain cross-reference associations to: SOP, Checklist, Template Software gains: Template (M:M), SOP (M:M), Checklist (M:M)

---

## Phase 3: AI Foundation

**Goal:** Introduce the Ops Coach and AI-assisted content creation.

### Ops Coach — Basic

- Slide-out panel from right side (icon in top bar)
- Type or talk (voice input via speech-to-text, e.g., OpenAI Whisper API)
- Context-aware: knows what page, record, or map the user is viewing
- Asks proactive questions and follow-ups (up to 3 per interaction)

**Capabilities in Phase 3:**

|Capability|Description|
|---|---|
|Draft SOP|User describes the activity → Ops Coach generates SOP draft → opens in Document View for review|
|Draft Checklist|Same pattern. Enforces checklist rules (max 10 items, action verbs, plain language)|
|Suggest Properties|For Core Activities: suggest description, trigger, end state based on title and context|
|Answer Questions|General operational questions using company profile and system data|
|Voice Notes|Record voice → AI transcribes → cleans up → populates Description or other markdown fields|

**AI Content Labeling:**

- All AI-generated content visually labeled (AI badge/icon) until human reviews and confirms
- Users always know whether content was AI-drafted or human-created
- Approval action removes the AI label and makes it a confirmed record

### Voice Input

- Microphone icon on all markdown fields (Description, Trigger, End State, SOP content, etc.)
- Record → speech-to-text → AI improvement pass → user reviews edited version
- Available in Ops Coach panel for conversational interaction

### Navigation Updates

- Add Ops Coach icon to top bar (reserved space from MVP)

---

## Phase 4: Org & Metrics

**Goal:** Add organizational structure depth and measurement capability.

### New Objects: Team, KPI, Feature

**Team**

|Property|Type|Notes|
|---|---|---|
|Team Title|Text||
|Description|Markdown||
|Team Lead|Person reference||
|Number of People|Number|Auto-calculated|
|Location|Text||
|Office|Text||
|Status|Simple lifecycle|Active / Inactive|

Associations: People (M:M), Role (M:M), Function (M:M), Subfunction (M:M), Equipment (when available, M:M), Vendor (when available, M:M), Subcontractor (when available, M:M)

**KPI (Key Performance Indicator)**

|Property|Type|Notes|
|---|---|---|
|KPI Title|Text||
|Description|Markdown||
|Target Value|Number||
|Unit|Text|Days, %, $, count|
|Direction|Select|Higher is Better / Lower is Better / Boolean (Yes/No) / Target Range|
|Frequency|Select|Daily / Weekly / Monthly / Quarterly|
|Calculation Method|Markdown||
|Status|Lifecycle|Active / Inactive / Under Development|

Associations: Core Activity (M:M), Process (M:M), Subfunction (M:M), Function (M:M), Role (M:M), Subcontractor (when available, M:M)

Direction logic: determines color coding. "Lower is Better" → 0% errors = green. "Higher is Better" → 100% close rate = green. Boolean → Yes = green.

Phase 4 KPIs are reference records only (define what to measure). Actual tracking in Phase 4b.

**Phase 4b: KPI Tracking**

- Actual value entry (weekly/monthly numbers)
- Trend charts on KPI record page (middle column)
- Scorecards view under KPIs nav (grouped by process, function, or role)

**Feature**

|Property|Type|Notes|
|---|---|---|
|Feature Title|Text||
|Description|Markdown||
|Parent Software|Software reference|Required|
|Required Tier/Plan|Text||
|Required Seat Level|Text||
|Number of Users|Number|Auto-calculated|
|Status|Lifecycle|Active / Not Using / Planned|

Associations: Software (M:1 parent), Core Activity (M:M), Process (M:M), Subfunction (M:M), Function (M:M), Template (M:M), SOP (M:M), Checklist (M:M)

Feature status (Active / Not Using) enables software redundancy analysis at the Software record level.

### Org Chart Map View

New map view under People nav.

**Singular View (default):**

- One instance per Role, regardless of how many people fill it
- Count label on Role nodes (e.g., "Account Manager ×10")
- Count label on Team groupings (e.g., "Sales Team ×4")
- Hierarchical arrangement by reporting structure
- Click Role → expand to see People

**Comprehensive View (toggle):**

- Every individual Role instance and Person shown
- Full team expansion

**People View (toggle):**

- Focused on individuals mapped to positions

Toggle controls: Singular / Comprehensive / People. Show/hide Teams.

### Navigation Updates

- Add Team under People nav group
- Add KPIs nav group (All KPIs, Scorecards in 4b)
- Add Features under Resources nav group
- Add Org Chart under People nav group

### Dashboard Enhancements

- People Spend (total payroll — auto-calculated from Person salaries)
- Software Spend (already in MVP, but enhanced with Feature utilization data)
- Equipment Spend (when Equipment added)
- KPI summary cards (Phase 4b)

---

## Phase 5: External & Equipment

**Goal:** Add external parties and physical assets.

### New Objects: Vendor, Subcontractor, Equipment

**Vendor**

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
|Contract Link|URL|Link to contract document|
|Deliverables|Markdown||
|Notes|Markdown||

Associations: Core Activity (M:M), Process (M:M), Function (M:M), Subfunction (M:M), Software (M:M), Equipment (M:M), Role (M:M), People (M:M), Team (M:M), SOP (M:M), Checklist (M:M), Template (M:M)

**Subcontractor**

|Property|Type|Notes|
|---|---|---|
|Company Name|Text||
|Contact Name|Text||
|Specialty|Text|Open field (user-customizable)|
|Email|Email||
|Primary Phone|Phone||
|License Number|Text||
|Insurance Status|Select|Current / Expired / Pending|
|Status|Simple lifecycle|Active / Inactive / On Hold|
|Notes|Markdown||

Associations: Core Activity (M:M), Process (M:M), Function (M:M), Subfunction (M:M), Role (M:M), People (M:M), Team (M:M), Equipment (M:M), SOP (M:M), Checklist (M:M), Template (M:M), KPI (M:M)

**Equipment**

|Property|Type|Notes|
|---|---|---|
|Equipment Title|Text||
|Type|Select|Heavy Equipment / Power Tool / Vehicle / Safety Equipment / etc.|
|Serial Number|Text||
|Purchase Date|Date||
|Cost|Currency|Purchase price|
|Depreciation Date|Date||
|Current Value|Currency||
|Maintenance Schedule|Markdown||
|Location|Text||
|Status|Simple lifecycle|Active / In Maintenance / Retired|

Associations: Core Activity (M:M), Process (M:M), People (M:M), Team (M:M), Vendor (M:M), Subcontractor (M:M)

### PDF Export (Maps Only)

- Workflow Map → PDF in vertical/portrait orientation
- Function Chart → PDF in landscape orientation
- Image-style export for printing or sharing with non-app users

### Navigation Updates

- Add Vendors, Subcontractors under People nav group
- Add Equipment under Resources nav group

---

## Phase 6: Advanced AI

**Goal:** AI becomes a primary workflow for building and improving operations.

### AI-Powered Onboarding Wizard

- Multi-step guided setup replacing documentation-based onboarding
- Conversational tone — one question at a time
- Free-text inputs (not ranges) — AI interprets and structures
- Collects: Company name, industry, revenue, employees, subcontractors, description, objectives, biggest pains
- AI generates Company Profile
- Functions presented as multi-select with industry-specific suggestions and education ("Most businesses have 6–12 Functions")
- AI auto-populates draft Subfunctions based on Functions, industry, company size
- AI auto-populates draft Core Activities under Subfunctions
- AI suggests Roles based on industry, functions, subfunctions
- Guided walkthrough using the user's actual draft data (click-through demo)
- Explanation of Draft vs. Active status
- Reset option: clear all auto-generated data and start from scratch, or keep as Draft
- Generic industry templates available as starting points (e.g., templates for residential remodeler, commercial GC, specialty contractor, etc.)

### Voice-to-Workflow

- User opens Ops Coach (dedicated page mode)
- Records voice describing a workflow from start to finish
- Speech-to-text processes audio
- AI generates complete Workflow: Phases, Processes, Core Activities with draft properties (description, trigger, end state)
- AI asks up to 3 follow-up questions to fill gaps
- AI offers gap analysis: "I noticed some missing steps. Want me to add draft items?"
- User reviews, edits, removes (X button), reorders, accepts
- AI suggests Subfunctions for each Core Activity
- Accepted workflow goes live (all as Draft, user marks Active as confirmed)

### AI Gap Analysis

- Available from Dashboard, Workflow Map, or Function Chart
- AI analyzes existing documentation against industry best practices
- Identifies: missing core activities, undocumented processes, processes without SOPs, roles without clear responsibilities, software with unused features
- Presents findings as actionable suggestions
- User can accept suggestions (creates Draft items) or dismiss

### Dashboard: Questions to Answer

- AI identifies gaps in the system and presents them as simple, clickable questions
- E.g., "Who is responsible for sending the final estimate to the client?"
- User clicks, answers (type or voice), AI updates the relevant records
- Guided way to fill in missing data without manually navigating to each record

### Software Feature Auto-Detection

- When a user adds a Software record, the Ops Coach can search for that software's feature list
- Auto-populates Feature records with names and descriptions
- Includes tier/plan level information where available
- User reviews and keeps/removes features

### Mind Sweep (Exploratory)

- AI provides a trigger list (areas of the business to think about)
- User talks through pains, frustrations, and concerns (voice input)
- AI maps responses to constraints in the business
- AI identifies sources of problems and asks follow-up questions
- Generates actionable recommendations tied to specific Processes, Subfunctions, or Core Activities
- Creates draft improvement items in the system

### Ops Coach Dedicated Page

- Full-page working environment for longer AI sessions
- Not just the slide-out panel — a dedicated workspace
- Used for: building workflows by voice, comprehensive gap analysis, mind sweeps
- Results create records in the system like the slide-out panel

### Proactive AI

- Ops Coach surfaces observations without being asked
- "I see your Estimating function has no active SOPs. Want me to help draft some?"
- Appears in Dashboard, in the slide-out panel, and as subtle prompts on relevant pages

---

## Phase 7: Agent Platform

**Goal:** Enable AI agents and external tools to operate within Ops Map.

### Agent API (Read/Write)

- Public API that serves structured data in markdown-friendly format (JSON with markdown content fields)
- **Read:** Any agent can query the current state of any object, workflow, function chart, or association
- **Write:** Agents can create records, update properties, modify associations, change statuses
- Authentication and permissions model for agent access
- Rate limiting and audit logging
- API documentation and developer portal

### CLI (Command Line Interface)

- Command-line tool for interacting with Ops Map
- Enables AI coding agents and automation scripts to manage operations data
- CRUD operations on all objects
- Trigger exports, run queries, update statuses
- Scriptable for batch operations

### Real-Time Agent Access

- Agents can read the live state of the system without requiring manual export
- Webhook support for real-time event notifications (record created, status changed, etc.)
- Agents can subscribe to changes on specific objects, workflows, or functions

### Checklist Manager App

- Separate attached application (not the main Ops Map UI)
- Employees get access to their assigned checklists
- Interactive completion: check items off during execution
- Completion timestamped in the activity feed for: the Person, the Core Activity, and the Process
- Tracks who completed what and when
- Mobile-friendly interface for field use

---

## Feature Dependency Map

Some features depend on others being built first.

|Feature|Depends On|
|---|---|
|Markdown Import|MVP (basic objects and maps must exist)|
|Document View|SOP/Checklist/Template objects|
|Ops Coach (basic)|Company Profile (MVP), speech-to-text integration|
|Voice Input|Speech-to-text integration|
|AI Content Generation|Ops Coach foundation|
|Org Chart|Team object, Role and Person objects (MVP)|
|KPI Tracking|KPI object (reference records first)|
|Scorecards|KPI Tracking|
|Feature redundancy analysis|Feature object, Software object (MVP)|
|Software feature auto-detection|Feature object, Ops Coach|
|AI Onboarding|Ops Coach, industry templates|
|Voice-to-Workflow|Ops Coach, voice input, Workflow Map (MVP)|
|Gap Analysis|Ops Coach, sufficient system data|
|Mind Sweep|Ops Coach, voice input, gap analysis patterns|
|Agent API|Agent-ready architecture (MVP foundation)|
|CLI|Agent API|
|Checklist Manager App|Checklist object, interactive completion design|

---

## Object Introduction Timeline

|Phase|Objects Added|Running Total|
|---|---|---|
|MVP|Function, Subfunction, Process, Core Activity, Person, Role, Software|7|
|Phase 2|SOP, Checklist, Template|10|
|Phase 4|Team, KPI, Feature|13|
|Phase 5|Vendor, Subcontractor, Equipment|16|

---

## Map/View Introduction Timeline

|Phase|Views Added|
|---|---|
|MVP|Function Chart (top + drill-down), Workflow Map, List View, Record View, Preview Panel, Quick-Create Panel, Dashboard, Global Search|
|Phase 2|Document View (Notion-style), Markdown Import Dialog|
|Phase 3|Ops Coach Panel (slide-out)|
|Phase 4|Org Chart, Scorecards View|
|Phase 5|PDF Export|
|Phase 6|Ops Coach Dedicated Page, AI Onboarding Wizard|

---

## Navigation Evolution

|Phase|Left Sidebar State|
|---|---|
|MVP|Home, Workflows (All Workflows, Processes), Functions (Function Chart, Functions, Subfunctions), Core Activities, People (People, Roles), Resources (Software)|
|Phase 2|+ Documents (SOPs, Checklists, Templates)|
|Phase 4|+ People: Teams, Org Chart. + KPIs (All KPIs, Scorecards). + Resources: Features|
|Phase 5|+ People: Vendors, Subcontractors. + Resources: Equipment|

|Phase|Top Bar State|
|---|---|
|MVP|Logo, Search, Create New, Notifications, Settings, Profile|
|Phase 3|+ Ops Coach icon|

---

## Open Architecture Questions (For Implementation Planning)

These need to be resolved during implementation planning, before coding begins:

1. **Database choice:** Relational (PostgreSQL) vs. hybrid. The extensible object model with custom properties suggests a flexible schema approach — possibly JSONB columns for custom properties alongside typed columns for standard properties.
    
2. **API design:** REST vs. GraphQL. The association-heavy data model with variable depth queries (show me a Function with its Subfunctions, their Core Activities, and each CA's Roles) suggests GraphQL could be a strong fit. But REST is simpler for the agent API layer.
    
3. **Real-time updates:** When a Core Activity is edited, the change must reflect on all views (list, maps, records) that display it. WebSocket connections or server-sent events vs. polling.
    
4. **Search architecture:** Global search across all objects needs to be fast. Full-text search engine (Elasticsearch) or database-native search (PostgreSQL full-text).
    
5. **Markdown rendering:** The markdown editor for Document View objects needs to support live preview, basic formatting toolbar, and clean export. Evaluate editor libraries.
    
6. **Voice/speech-to-text integration (Phase 3):** OpenAI Whisper API or alternatives. Latency requirements for real-time voice input vs. record-and-process.
    
7. **Agent API authentication (Phase 7):** API keys, OAuth, or token-based auth for agent access. Scoping and permissions model.
    
8. **Multi-tenancy:** Each company is an isolated tenant. Data isolation, backup, and scaling model.
    
9. **File storage:** Profile photos, video embeds (URL-based, not stored), and future document attachments. CDN and storage strategy.
    
10. **Hosting/deployment:** Cloud provider, CI/CD pipeline, staging environment requirements.