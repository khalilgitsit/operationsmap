# Ops Map YAML Import Schema Reference

Complete reference for generating valid YAML that can be imported into Ops Map.

## Contents

- [Workflow YAML Schema](#workflow-yaml-schema)
- [Function Chart YAML Schema](#function-chart-yaml-schema)
- [Validation Rules](#validation-rules)
- [Common Mistakes](#common-mistakes)
- [Annotated Examples](#annotated-examples)

---

## Workflow YAML Schema

A workflow represents a sequential business process with phases, processes, core activities, and handoff blocks.

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow` | object | **Yes** | Top-level wrapper object |
| `workflow.title` | string | **Yes** | Name of the workflow (e.g., "Employee Onboarding") |
| `workflow.description` | string | No | Brief description of the workflow's purpose |
| `workflow.phases` | array | **Yes** | List of phases (minimum 1 item) |

#### Phase Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Name of the phase (e.g., "Intake") |
| `description` | string | No | What happens during this phase |
| `processes` | array | No | List of processes within this phase |
| `handoffs` | array | No | List of handoff blocks at the end of this phase |

#### Process Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Name of the process (e.g., "Verify Application") |
| `trigger` | string | No | What initiates this process |
| `end_state` | string | No | What the completed state looks like |
| `description` | string | No | Detailed description of the process |
| `estimated_duration` | string | No | How long this process typically takes (e.g., "2-3 business days") |
| `core_activities` | array | No | List of core activities within this process |

#### Core Activity Fields (under processes)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Name of the activity (e.g., "Review and validate submitted documents") |
| `trigger` | string | No | What initiates this activity |
| `end_state` | string | No | What the completed state looks like |

#### Handoff Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | **Yes** | Description of the handoff (e.g., "Approved application sent to onboarding team") |

---

## Function Chart YAML Schema

A function chart represents an organizational structure with functions, subfunctions, and core activities.

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `functions` | array | **Yes** | Top-level list of functions (minimum 1 item) |

#### Function Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Name of the function (e.g., "Finance") |
| `description` | string | No | What this function is responsible for |
| `subfunctions` | array | No | List of subfunctions within this function |

#### Subfunction Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Name of the subfunction (e.g., "Accounts Payable") |
| `description` | string | No | What this subfunction handles |
| `core_activities` | array | No | List of core activities within this subfunction |

#### Core Activity Fields (under subfunctions)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Name of the activity (e.g., "Process and approve vendor invoices") |
| `trigger` | string | No | What initiates this activity |
| `end_state` | string | No | What the completed state looks like |

---

## Validation Rules

These constraints are enforced by the Ops Map import parser. Violating any of them will produce a validation error.

1. **The top-level key must be exactly `workflow:`** (not `workflow_map:`, `Workflow:`, or `workflows:`)
2. **The top-level key must be exactly `functions:`** (not `function_chart:`, `Functions:`, or `function:`)
3. **Every phase, process, core activity, function, and subfunction must have a `title` field** — this is the only universally required field
4. **`phases` array must contain at least 1 item** — a workflow with zero phases is invalid
5. **`functions` array must contain at least 1 item** — a function chart with zero functions is invalid
6. **All optional arrays (`processes`, `core_activities`, `subfunctions`, `handoffs`) can be omitted if empty** — do not write `core_activities: []`, just leave the key out entirely
7. **Do not include `status` fields** — all items are imported as Draft regardless. Adding a `status` field will cause a validation error
8. **String values containing colons must be quoted** — e.g., `trigger: "When: order arrives"` not `trigger: When: order arrives`
9. **Use 2-space indentation** — YAML requires consistent indentation; 2 spaces per level is the convention

---

## Common Mistakes

### Wrong: Using tabs for indentation
```yaml
# BAD — tabs will cause parse errors
functions:
	- title: "Finance"
		subfunctions:
			- title: "AP"
```
```yaml
# GOOD — use 2 spaces per indent level
functions:
  - title: "Finance"
    subfunctions:
      - title: "AP"
```

### Wrong: Forgetting to quote strings with special characters
```yaml
# BAD — unquoted colon causes parse error
trigger: When: the order is placed
description: Items {large} need special handling
```
```yaml
# GOOD — quote strings containing : # { } [ ]
trigger: "When: the order is placed"
description: "Items {large} need special handling"
```

### Wrong: Using null or ~ instead of omitting optional fields
```yaml
# BAD — use omission, not null
- title: "Review"
  trigger: null
  end_state: ~
```
```yaml
# GOOD — simply omit optional fields with no value
- title: "Review"
```

### Wrong: Incorrect nesting (processes under workflow instead of under phases)
```yaml
# BAD — processes must be nested under phases, not directly under workflow
workflow:
  title: "My Workflow"
  processes:
    - title: "Step 1"
  phases:
    - title: "Phase 1"
```
```yaml
# GOOD — processes are nested inside each phase
workflow:
  title: "My Workflow"
  phases:
    - title: "Phase 1"
      processes:
        - title: "Step 1"
```

### Wrong: Using incorrect top-level keys
```yaml
# BAD — wrong key names
workflow_map:
  title: "My Workflow"

function_chart:
  - title: "Finance"

Workflow:
  title: "My Workflow"
```
```yaml
# GOOD — exact key names required
workflow:
  title: "My Workflow"

functions:
  - title: "Finance"
```

---

## Annotated Examples

### Workflow Example

A complete workflow with 3 phases, multiple processes, core activities with triggers/end states, and handoff blocks.

```yaml
workflow:
  title: "Employee Onboarding"
  description: "End-to-end process for onboarding new employees from offer acceptance to full productivity"
  phases:
    - title: "Pre-boarding"
      description: "Preparation before the employee's first day"
      processes:
        - title: "IT Provisioning"
          trigger: "Signed offer letter received by HR"
          end_state: "All accounts and equipment ready for day one"
          description: "Set up all technology resources for the new hire"
          estimated_duration: "3-5 business days"
          core_activities:
            - title: "Create email account and set up directory profile"
              trigger: "IT ticket submitted by HR"
              end_state: "Email account active and accessible"
            - title: "Provision laptop with standard software image"
              trigger: "Equipment request approved"
              end_state: "Laptop configured and shipped to office or home"
            - title: "Grant access to required systems and tools"
              trigger: "Manager submits access request form"
              end_state: "All system access verified and documented"
        - title: "Workspace Preparation"
          trigger: "Start date confirmed"
          end_state: "Physical or virtual workspace ready"
          core_activities:
            - title: "Assign desk or office space"
            - title: "Order business cards and name badge"
      handoffs:
        - label: "Pre-boarding checklist completed and sent to hiring manager"

    - title: "First Week"
      description: "Orientation, introductions, and initial setup"
      processes:
        - title: "Day One Orientation"
          trigger: "Employee arrives on first day"
          end_state: "Employee has completed all required orientation activities"
          estimated_duration: "1 day"
          core_activities:
            - title: "Conduct welcome session and office tour"
              trigger: "Employee checks in at reception"
              end_state: "Employee oriented to physical space and key contacts"
            - title: "Complete HR paperwork and benefits enrollment"
              trigger: "Welcome session completed"
              end_state: "All employment documents signed and filed"
            - title: "Set up workstation and verify system access"
              trigger: "Employee receives equipment"
              end_state: "All tools working and employee can log in"
        - title: "Team Integration"
          trigger: "Day one orientation completed"
          end_state: "Employee introduced to team and understands team norms"
          core_activities:
            - title: "Schedule and conduct one-on-one with direct manager"
            - title: "Introduce to team members and key stakeholders"
            - title: "Review team communication channels and meeting cadence"
      handoffs:
        - label: "First week summary sent to manager for review"

    - title: "First 90 Days"
      description: "Ramp-up period with increasing responsibilities and check-ins"
      processes:
        - title: "Training and Development"
          trigger: "First week completed"
          end_state: "Employee completes all required training modules"
          estimated_duration: "30-60 days"
          core_activities:
            - title: "Complete mandatory compliance and safety training"
              trigger: "Training portal access granted"
              end_state: "All certifications obtained"
            - title: "Shadow experienced team members on key workflows"
            - title: "Complete role-specific technical training"
        - title: "Performance Check-ins"
          trigger: "30-day mark reached"
          end_state: "Employee confirmed as fully onboarded"
          core_activities:
            - title: "Conduct 30-day check-in with manager"
              trigger: "30 days since start date"
              end_state: "Feedback documented and any concerns addressed"
            - title: "Conduct 60-day progress review"
            - title: "Complete 90-day performance evaluation and goal setting"
              end_state: "Onboarding formally closed, ongoing performance cycle begins"
```

### Function Chart Example

A complete function chart with 3 functions, multiple subfunctions, and core activities with triggers/end states.

```yaml
functions:
  - title: "Finance"
    description: "Financial planning, accounting, and compliance"
    subfunctions:
      - title: "Accounts Payable"
        description: "Managing outgoing payments to vendors and suppliers"
        core_activities:
          - title: "Receive and validate vendor invoices"
            trigger: "Invoice received via email or portal"
            end_state: "Invoice matched to PO and approved for payment"
          - title: "Process payment runs and issue checks or wire transfers"
            trigger: "Approved invoices batch reaches payment date"
            end_state: "Payments issued and recorded in general ledger"
          - title: "Reconcile vendor statements and resolve discrepancies"
            trigger: "Monthly vendor statement received"
            end_state: "All discrepancies resolved and documented"
      - title: "Accounts Receivable"
        description: "Managing incoming payments from customers"
        core_activities:
          - title: "Generate and send customer invoices"
            trigger: "Service delivered or product shipped"
            end_state: "Invoice sent to customer with correct terms"
          - title: "Track outstanding receivables and follow up on overdue accounts"
            trigger: "Invoice past due date"
            end_state: "Payment received or escalation initiated"
          - title: "Process incoming payments and apply to customer accounts"
            trigger: "Payment received"
            end_state: "Payment recorded and account balance updated"
      - title: "Financial Reporting"
        description: "Preparing financial statements and management reports"
        core_activities:
          - title: "Prepare monthly financial close and generate statements"
          - title: "Compile quarterly board reporting package"
          - title: "Coordinate annual external audit"

  - title: "Human Resources"
    description: "People management, talent acquisition, and employee development"
    subfunctions:
      - title: "Talent Acquisition"
        description: "Recruiting and hiring new employees"
        core_activities:
          - title: "Define job requirements and post positions to job boards"
            trigger: "Hiring manager submits staffing request"
            end_state: "Job posting live on all target channels"
          - title: "Screen applications and conduct initial phone interviews"
            trigger: "Applications received"
            end_state: "Shortlist of qualified candidates prepared"
          - title: "Coordinate interview panels and collect feedback"
            trigger: "Candidates shortlisted"
            end_state: "Interview feedback compiled and hiring decision made"
          - title: "Extend offer and negotiate terms"
            trigger: "Hiring decision approved"
            end_state: "Signed offer letter received"
      - title: "Compensation and Benefits"
        description: "Managing employee pay, benefits, and total rewards"
        core_activities:
          - title: "Administer payroll processing and tax withholdings"
          - title: "Manage health insurance and retirement plan enrollment"
          - title: "Conduct annual compensation benchmarking and salary reviews"
      - title: "Employee Relations"
        description: "Workplace culture, conflict resolution, and compliance"
        core_activities:
          - title: "Investigate and resolve workplace complaints"
          - title: "Administer employee engagement surveys and action plans"

  - title: "Information Technology"
    description: "Technology infrastructure, applications, and security"
    subfunctions:
      - title: "Infrastructure and Operations"
        description: "Managing servers, networks, and cloud services"
        core_activities:
          - title: "Monitor system uptime and respond to infrastructure alerts"
            trigger: "Alert received from monitoring system"
            end_state: "Issue resolved and root cause documented"
          - title: "Manage cloud resource provisioning and cost optimization"
          - title: "Execute backup procedures and disaster recovery testing"
      - title: "Application Development"
        description: "Building and maintaining internal and customer-facing applications"
        core_activities:
          - title: "Gather requirements and design technical solutions"
            trigger: "Feature request approved by product team"
            end_state: "Technical design document reviewed and approved"
          - title: "Develop, test, and deploy application changes"
            trigger: "Design approved and sprint planned"
            end_state: "Changes deployed to production with zero critical defects"
          - title: "Maintain and patch existing applications"
      - title: "Cybersecurity"
        description: "Protecting systems, data, and users from threats"
        core_activities:
          - title: "Monitor security events and investigate potential threats"
            trigger: "Security alert or anomaly detected"
            end_state: "Threat assessed, contained if necessary, and documented"
          - title: "Conduct vulnerability assessments and penetration testing"
          - title: "Manage identity and access controls"
```
