---
name: ops-import
description: Generate valid structured YAML for Ops Map import. Use when asked to create, generate, or build a workflow or function chart for import into Ops Map. Takes a natural language description of a business operation and produces YAML that can be pasted directly into the Ops Map import dialog.
allowed-tools: Read
---

# Ops Map Import Skill

Generate valid structured YAML for importing workflows and function charts into Ops Map.

## Workflow

Follow these steps in order every time this skill is invoked.

### Step 1: Determine Import Type

Ask the user whether they want to generate:

- **Workflow** — a sequential process with phases, processes, core activities, and handoffs. Use when the user describes something that flows through stages (e.g., "employee onboarding process", "order fulfillment pipeline", "incident response procedure").
- **Function Chart** — an organizational structure with functions, subfunctions, and core activities. Use when the user describes departments, teams, or functional areas (e.g., "our engineering org structure", "finance department breakdown", "operations team responsibilities").

If the intent is clear from context, proceed without asking. If ambiguous, ask:

> "Would you like a **Workflow** (sequential process with phases) or a **Function Chart** (organizational structure with functions/departments)?"

### Step 2: Gather Information

Ask 2-3 focused clarifying questions before generating. Do not overwhelm the user — keep it brief.

**For Workflows, ask about:**
- What are the main phases or stages?
- What triggers the workflow? What's the desired end state?
- How granular should it be? (high-level overview vs. detailed step-by-step)

**For Function Charts, ask about:**
- What are the top-level functions or departments?
- What are the key subfunctions or teams within each?
- How detailed should core activities be?

If the user has already provided enough detail in their initial request, skip directly to generation.

### Step 3: Read the Schema Reference

Before generating any YAML, read the schema reference file to ensure format compliance:

```
Read references/yaml-schema.md
```

This file contains the complete field reference, validation rules, annotated examples, and common mistakes. Always consult it before generating output.

### Step 4: Generate YAML

Produce valid YAML following the schema exactly. Guidelines:

- **Use descriptive, action-oriented titles** for core activities (e.g., "Review and validate invoice details" not just "Review")
- **Never invent field names** not in the schema — only use fields documented in the reference
- **Do not include `status` fields** — all imported items are created as Draft automatically
- **Omit optional fields** that don't have meaningful values rather than setting them to empty strings or null
- **Quote strings containing special characters** (`:`, `#`, `{`, `}`, `[`, `]`) with double quotes
- **Use 2-space indentation** consistently (never tabs)
- **Make it realistic** — use language appropriate for business operations

### Step 5: Present Output

1. Display the generated YAML in a fenced code block with the `yaml` language tag
2. Provide a brief summary of what was generated:
   - For workflows: number of phases, processes, core activities, and handoffs
   - For function charts: number of functions, subfunctions, and core activities
3. Include this usage note:

> To import this into Ops Map:
> 1. Open the **Import** dialog on the Function Chart or Workflows page
> 2. Select **Structured YAML** format
> 3. Paste the YAML above
> 4. Click **Parse & Preview** to verify the structure
> 5. Click **Import** to create all items as Draft

## References

| Reference | When to Read |
|-----------|--------------|
| [references/yaml-schema.md](references/yaml-schema.md) | **Always** — read before generating any YAML to ensure schema compliance |

## Templates

| Template | Purpose |
|----------|---------|
| [templates/workflow-template.yaml](templates/workflow-template.yaml) | Minimal valid workflow structure showing all available fields |
| [templates/function-chart-template.yaml](templates/function-chart-template.yaml) | Minimal valid function chart structure showing all available fields |
