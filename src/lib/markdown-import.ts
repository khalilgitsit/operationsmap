/**
 * Markdown Import Parser
 *
 * Parses markdown exported by markdown-export.ts (and compatible user-authored markdown)
 * back into structured data for Function Chart and Workflow Map import.
 *
 * Function Chart format:
 *   # Function Chart (optional top-level heading)
 *   ## Function Title
 *   **Status:** Draft
 *   description text
 *   ### Subfunction Title
 *   **Status:** Draft
 *   - **Core Activity Title** (Status)
 *
 * Workflow format:
 *   # Workflow Title
 *   description text
 *   ## Phase N: Phase Title
 *   phase description
 *   ### N.M Process Title
 *   **Status:** Active
 *   **Trigger:** ...
 *   **End State:** ...
 *   process description
 *   **Core Activities:**
 *   1. **Activity Title** (Status)
 *      - Trigger: ...
 *      - End State: ...
 *   > **Handoff:** label
 */

// ---- Parsed types ----

export interface ParsedCoreActivity {
  title: string;
  status?: string;
  trigger?: string;
  end_state?: string;
}

export interface ParsedSubfunction {
  title: string;
  status?: string;
  description?: string;
  coreActivities: ParsedCoreActivity[];
}

export interface ParsedFunction {
  title: string;
  status?: string;
  description?: string;
  subfunctions: ParsedSubfunction[];
}

export interface ParsedFunctionChart {
  functions: ParsedFunction[];
}

export interface ParsedProcess {
  title: string;
  status?: string;
  trigger?: string;
  end_state?: string;
  description?: string;
  coreActivities: ParsedCoreActivity[];
}

export interface ParsedHandoff {
  label: string;
}

export interface ParsedPhase {
  title: string;
  description?: string;
  processes: ParsedProcess[];
  handoffs: ParsedHandoff[];
}

export interface ParsedWorkflow {
  title: string;
  description?: string;
  phases: ParsedPhase[];
}

export type ImportScope =
  | 'entire_chart'
  | 'single_function'
  | 'single_subfunction'
  | 'entire_workflow';

// ---- Helpers ----

function extractField(line: string, label: string): string | undefined {
  const regex = new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`);
  const match = line.match(regex);
  return match ? match[1].trim() : undefined;
}

function parseStatusFromParens(text: string): string | undefined {
  const match = text.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : undefined;
}

function parseTitleFromBold(text: string): string {
  // Extract from "**Title** (Status)" or "**Title**"
  const match = text.match(/\*\*(.+?)\*\*/);
  return match ? match[1].trim() : text.trim();
}

function stripNumberPrefix(title: string): string {
  // Remove numbered prefixes like "1.2 " or "1. "
  return title.replace(/^\d+(\.\d+)?\s+/, '').trim();
}

// ---- Function Chart Parser ----

export function parseFunctionChartMarkdown(markdown: string): ParsedFunctionChart {
  const lines = markdown.split('\n');
  const result: ParsedFunctionChart = { functions: [] };

  let currentFunction: ParsedFunction | null = null;
  let currentSubfunction: ParsedSubfunction | null = null;
  let collectingDescription: string[] = [];
  let descriptionTarget: 'function' | 'subfunction' | null = null;

  function flushDescription() {
    if (descriptionTarget && collectingDescription.length > 0) {
      const desc = collectingDescription.join('\n').trim();
      if (desc) {
        if (descriptionTarget === 'function' && currentFunction) {
          currentFunction.description = desc;
        } else if (descriptionTarget === 'subfunction' && currentSubfunction) {
          currentSubfunction.description = desc;
        }
      }
    }
    collectingDescription = [];
    descriptionTarget = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines but accumulate for descriptions
    if (trimmed === '') {
      if (descriptionTarget) collectingDescription.push('');
      continue;
    }

    // H1: "# Function Chart" — skip, or treat as function if no "Function Chart" title
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      const h1Title = trimmed.slice(2).trim();
      if (h1Title.toLowerCase() === 'function chart') continue;
      // If H1 is not "Function Chart", treat as a single function being imported
      flushDescription();
      if (currentSubfunction && currentFunction) {
        currentFunction.subfunctions.push(currentSubfunction);
        currentSubfunction = null;
      }
      if (currentFunction) result.functions.push(currentFunction);
      currentFunction = { title: h1Title, subfunctions: [] };
      descriptionTarget = 'function';
      continue;
    }

    // H2: Function
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      flushDescription();
      if (currentSubfunction && currentFunction) {
        currentFunction.subfunctions.push(currentSubfunction);
        currentSubfunction = null;
      }
      if (currentFunction) result.functions.push(currentFunction);
      currentFunction = { title: trimmed.slice(3).trim(), subfunctions: [] };
      descriptionTarget = 'function';
      continue;
    }

    // H3: Subfunction
    if (trimmed.startsWith('### ')) {
      flushDescription();
      if (currentSubfunction && currentFunction) {
        currentFunction.subfunctions.push(currentSubfunction);
      }
      currentSubfunction = {
        title: trimmed.slice(4).trim(),
        coreActivities: [],
      };
      descriptionTarget = 'subfunction';
      continue;
    }

    // Status line
    const status = extractField(trimmed, 'Status');
    if (status) {
      if (currentSubfunction) {
        currentSubfunction.status = status;
      } else if (currentFunction) {
        currentFunction.status = status;
      }
      continue;
    }

    // Bullet: Core Activity within subfunction
    if (trimmed.startsWith('- ') && currentSubfunction) {
      flushDescription();
      const bulletContent = trimmed.slice(2).trim();
      const caTitle = parseTitleFromBold(bulletContent);
      const caStatus = parseStatusFromParens(bulletContent);
      if (caTitle) {
        currentSubfunction.coreActivities.push({
          title: caTitle,
          status: caStatus,
        });
      }
      continue;
    }

    // Skip association sections and their content
    if (trimmed === '## Associations' || trimmed === '## Description') {
      flushDescription();
      descriptionTarget = null;
      continue;
    }
    if (trimmed.startsWith('**') && trimmed.endsWith(':**')) {
      // Association label like "**Roles:**"
      continue;
    }

    // Collect description text
    if (descriptionTarget) {
      collectingDescription.push(trimmed);
    }
  }

  // Flush remaining
  flushDescription();
  if (currentSubfunction && currentFunction) {
    currentFunction.subfunctions.push(currentSubfunction);
  }
  if (currentFunction) result.functions.push(currentFunction);

  return result;
}

// ---- Workflow Parser ----

export function parseWorkflowMarkdown(markdown: string): ParsedWorkflow {
  const lines = markdown.split('\n');
  const result: ParsedWorkflow = { title: 'Imported Workflow', phases: [] };

  let currentPhase: ParsedPhase | null = null;
  let currentProcess: ParsedProcess | null = null;
  let currentCA: ParsedCoreActivity | null = null;
  let inCoreActivities = false;
  let collectingDescription: string[] = [];
  let descriptionTarget: 'workflow' | 'phase' | 'process' | null = null;

  function flushDescription() {
    if (descriptionTarget && collectingDescription.length > 0) {
      const desc = collectingDescription.join('\n').trim();
      if (desc) {
        if (descriptionTarget === 'workflow') {
          result.description = desc;
        } else if (descriptionTarget === 'phase' && currentPhase) {
          currentPhase.description = desc;
        } else if (descriptionTarget === 'process' && currentProcess) {
          currentProcess.description = desc;
        }
      }
    }
    collectingDescription = [];
    descriptionTarget = null;
  }

  function finishCA() {
    if (currentCA && currentProcess) {
      currentProcess.coreActivities.push(currentCA);
      currentCA = null;
    }
  }

  function finishProcess() {
    finishCA();
    if (currentProcess && currentPhase) {
      currentPhase.processes.push(currentProcess);
      currentProcess = null;
    }
    inCoreActivities = false;
  }

  function finishPhase() {
    flushDescription();
    finishProcess();
    if (currentPhase) {
      result.phases.push(currentPhase);
      currentPhase = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      if (descriptionTarget) collectingDescription.push('');
      continue;
    }

    // H1: Workflow title
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      result.title = trimmed.slice(2).trim();
      descriptionTarget = 'workflow';
      continue;
    }

    // H2: Phase - "## Phase N: Title"
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      flushDescription();
      finishPhase();
      let phaseTitle = trimmed.slice(3).trim();
      // Remove "Phase N: " prefix
      phaseTitle = phaseTitle.replace(/^Phase\s+\d+:\s*/i, '');
      currentPhase = {
        title: phaseTitle,
        processes: [],
        handoffs: [],
      };
      descriptionTarget = 'phase';
      continue;
    }

    // H3: Process - "### N.M Process Title"
    if (trimmed.startsWith('### ')) {
      flushDescription();
      finishProcess();
      let processTitle = trimmed.slice(4).trim();
      processTitle = stripNumberPrefix(processTitle);
      currentProcess = {
        title: processTitle,
        coreActivities: [],
      };
      inCoreActivities = false;
      descriptionTarget = 'process';
      continue;
    }

    // Handoff block: "> **Handoff:** label"
    if (trimmed.startsWith('> ') && currentPhase) {
      flushDescription();
      finishProcess();
      const handoffContent = trimmed.slice(2).trim();
      const handoffMatch = handoffContent.match(/\*\*Handoff:\*\*\s*(.+)/);
      if (handoffMatch) {
        currentPhase.handoffs.push({ label: handoffMatch[1].trim() });
      }
      continue;
    }

    // "**Core Activities:**" marker
    if (trimmed === '**Core Activities:**') {
      flushDescription();
      inCoreActivities = true;
      continue;
    }

    // Status/Trigger/End State fields on process
    if (currentProcess && !inCoreActivities) {
      const processStatus = extractField(trimmed, 'Status');
      if (processStatus) {
        currentProcess.status = processStatus;
        continue;
      }
      const trigger = extractField(trimmed, 'Trigger');
      if (trigger) {
        currentProcess.trigger = trigger;
        continue;
      }
      const endState = extractField(trimmed, 'End State');
      if (endState) {
        currentProcess.end_state = endState;
        continue;
      }
    }

    // Numbered list item: Core Activity "1. **Title** (Status)"
    if (inCoreActivities && /^\d+\.\s/.test(trimmed)) {
      finishCA();
      const content = trimmed.replace(/^\d+\.\s*/, '').trim();
      const caTitle = parseTitleFromBold(content);
      const caStatus = parseStatusFromParens(content);
      currentCA = { title: caTitle, status: caStatus };
      continue;
    }

    // Indented sub-items under CA: "   - Trigger: ..."
    if (inCoreActivities && currentCA && trimmed.startsWith('- ')) {
      const subContent = trimmed.slice(2).trim();
      const triggerMatch = subContent.match(/^Trigger:\s*(.+)/);
      if (triggerMatch) {
        currentCA.trigger = triggerMatch[1].trim();
        continue;
      }
      const endStateMatch = subContent.match(/^End State:\s*(.+)/);
      if (endStateMatch) {
        currentCA.end_state = endStateMatch[1].trim();
        continue;
      }
    }

    // Collect description text
    if (descriptionTarget) {
      collectingDescription.push(trimmed);
    }
  }

  // Flush remaining
  flushDescription();
  finishPhase();

  return result;
}

// ---- Preview tree node type ----

export interface ImportTreeNode {
  type: 'function' | 'subfunction' | 'core_activity' | 'phase' | 'process' | 'handoff';
  title: string;
  status?: string;
  children: ImportTreeNode[];
}

export function functionChartToTree(data: ParsedFunctionChart): ImportTreeNode[] {
  return data.functions.map((fn) => ({
    type: 'function' as const,
    title: fn.title,
    status: fn.status,
    children: fn.subfunctions.map((sf) => ({
      type: 'subfunction' as const,
      title: sf.title,
      status: sf.status,
      children: sf.coreActivities.map((ca) => ({
        type: 'core_activity' as const,
        title: ca.title,
        status: ca.status,
        children: [],
      })),
    })),
  }));
}

export function workflowToTree(data: ParsedWorkflow): ImportTreeNode[] {
  return data.phases.map((phase) => ({
    type: 'phase' as const,
    title: phase.title,
    children: [
      ...phase.processes.map((proc) => ({
        type: 'process' as const,
        title: proc.title,
        status: proc.status,
        children: proc.coreActivities.map((ca) => ({
          type: 'core_activity' as const,
          title: ca.title,
          status: ca.status,
          children: [],
        })),
      })),
      ...phase.handoffs.map((h) => ({
        type: 'handoff' as const,
        title: h.label,
        children: [],
      })),
    ],
  }));
}

// ---- Count items for summary ----

export function countFunctionChartItems(data: ParsedFunctionChart) {
  let functions = 0;
  let subfunctions = 0;
  let coreActivities = 0;
  for (const fn of data.functions) {
    functions++;
    for (const sf of fn.subfunctions) {
      subfunctions++;
      coreActivities += sf.coreActivities.length;
    }
  }
  return { functions, subfunctions, coreActivities };
}

export function countWorkflowItems(data: ParsedWorkflow) {
  let phases = 0;
  let processes = 0;
  let coreActivities = 0;
  let handoffs = 0;
  for (const phase of data.phases) {
    phases++;
    handoffs += phase.handoffs.length;
    for (const proc of phase.processes) {
      processes++;
      coreActivities += proc.coreActivities.length;
    }
  }
  return { phases, processes, coreActivities, handoffs };
}
