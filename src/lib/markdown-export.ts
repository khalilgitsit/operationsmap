import { getObjectConfig, getRecordTitle, type ObjectConfig } from '@/lib/object-config';

type RecordData = Record<string, unknown>;

function statusLine(status: string | undefined | null): string {
  return status ? `**Status:** ${status}` : '';
}

function field(label: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  return `**${label}:** ${value}`;
}

function lines(...parts: string[]): string {
  return parts.filter(Boolean).join('\n');
}

function section(heading: string, level: number, content: string): string {
  if (!content.trim()) return '';
  const prefix = '#'.repeat(level);
  return `${prefix} ${heading}\n\n${content}`;
}

function associationList(label: string, items: RecordData[], config: ObjectConfig): string {
  if (!items.length) return '';
  const lines = items.map((item) => `- ${getRecordTitle(item, config)}`).join('\n');
  return `**${label}:**\n${lines}`;
}

// ---- Per-object exporters ----

export function exportCoreActivity(
  record: RecordData,
  associations: Record<string, RecordData[]>
): string {
  const parts = [
    `# ${record.title || 'Untitled Core Activity'}`,
    '',
    statusLine(record.status as string),
    field('Trigger', record.trigger),
    field('End State', record.end_state),
    record.video_url ? field('Video', record.video_url) : '',
    '',
    record.description ? `## Description\n\n${record.description}` : '',
  ];

  // Associations
  const assocParts: string[] = [];
  if (associations['core_activity_roles']?.length) {
    assocParts.push(associationList('Roles', associations['core_activity_roles'], getObjectConfig('role')));
  }
  if (associations['core_activity_people']?.length) {
    assocParts.push(associationList('People', associations['core_activity_people'], getObjectConfig('person')));
  }
  if (associations['core_activity_software']?.length) {
    assocParts.push(associationList('Software', associations['core_activity_software'], getObjectConfig('software')));
  }

  if (assocParts.length) {
    parts.push('', '## Associations', '', assocParts.join('\n\n'));
  }

  return lines(...parts);
}

export function exportProcess(
  record: RecordData,
  associations: Record<string, RecordData[]>
): string {
  const parts = [
    `# ${record.title || 'Untitled Process'}`,
    '',
    statusLine(record.status as string),
    field('Trigger', record.trigger),
    field('End State', record.end_state),
    field('Estimated Duration', record.estimated_duration),
    '',
    record.description ? `## Description\n\n${record.description}` : '',
  ];

  // Core Activities (ordered)
  const cas = associations['process_core_activities'] || [];
  if (cas.length) {
    parts.push('', '## Core Activities', '');
    cas.forEach((ca, i) => {
      parts.push(`### ${i + 1}. ${ca.title || 'Untitled'}`);
      parts.push('');
      if (ca.status) parts.push(statusLine(ca.status as string));
      if (ca.trigger) parts.push(field('Trigger', ca.trigger));
      if (ca.end_state) parts.push(field('End State', ca.end_state));
      if (ca.description) parts.push('', ca.description as string);
      parts.push('');
    });
  }

  // Other associations
  const assocParts: string[] = [];
  if (associations['process_roles_involved']?.length) {
    assocParts.push(associationList('Roles Involved', associations['process_roles_involved'], getObjectConfig('role')));
  }
  if (associations['process_people_involved']?.length) {
    assocParts.push(associationList('People Involved', associations['process_people_involved'], getObjectConfig('person')));
  }
  if (associations['process_software']?.length) {
    assocParts.push(associationList('Software', associations['process_software'], getObjectConfig('software')));
  }

  if (assocParts.length) {
    parts.push('## Associations', '', assocParts.join('\n\n'));
  }

  return lines(...parts);
}

export function exportSubfunction(
  record: RecordData,
  associations: Record<string, RecordData[]>
): string {
  const parts = [
    `# ${record.title || 'Untitled Subfunction'}`,
    '',
    statusLine(record.status as string),
    '',
    record.description ? `## Description\n\n${record.description}` : '',
  ];

  // Core Activities (children)
  const cas = associations['_children'] || [];
  if (cas.length) {
    parts.push('', '## Core Activities', '');
    cas.forEach((ca) => {
      parts.push(`- **${ca.title || 'Untitled'}** (${ca.status || 'No status'})`);
    });
  }

  const assocParts: string[] = [];
  if (associations['subfunction_roles']?.length) {
    assocParts.push(associationList('Roles', associations['subfunction_roles'], getObjectConfig('role')));
  }
  if (associations['subfunction_people']?.length) {
    assocParts.push(associationList('People', associations['subfunction_people'], getObjectConfig('person')));
  }
  if (associations['subfunction_software']?.length) {
    assocParts.push(associationList('Software', associations['subfunction_software'], getObjectConfig('software')));
  }

  if (assocParts.length) {
    parts.push('', '## Associations', '', assocParts.join('\n\n'));
  }

  return lines(...parts);
}

export function exportFunction(
  record: RecordData,
  associations: Record<string, RecordData[]>
): string {
  const parts = [
    `# ${record.title || 'Untitled Function'}`,
    '',
    statusLine(record.status as string),
    '',
    record.description ? `## Description\n\n${record.description}` : '',
  ];

  // Subfunctions (children)
  const subs = associations['_children'] || [];
  if (subs.length) {
    parts.push('', '## Subfunctions', '');
    subs.forEach((sub) => {
      parts.push(`### ${sub.title || 'Untitled'}`);
      parts.push('');
      if (sub.status) parts.push(statusLine(sub.status as string));
      if (sub.description) parts.push('', sub.description as string);
      parts.push('');
    });
  }

  const assocParts: string[] = [];
  if (associations['function_roles']?.length) {
    assocParts.push(associationList('Roles', associations['function_roles'], getObjectConfig('role')));
  }
  if (associations['function_people']?.length) {
    assocParts.push(associationList('People', associations['function_people'], getObjectConfig('person')));
  }
  if (associations['function_software']?.length) {
    assocParts.push(associationList('Software', associations['function_software'], getObjectConfig('software')));
  }

  if (assocParts.length) {
    parts.push('## Associations', '', assocParts.join('\n\n'));
  }

  return lines(...parts);
}

export function exportPerson(
  record: RecordData,
  associations: Record<string, RecordData[]>
): string {
  const name = `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Untitled Person';
  const parts = [
    `# ${name}`,
    '',
    statusLine(record.status as string),
    field('Job Title', record.job_title),
    field('Email', record.email),
    field('Phone', record.phone),
    field('Location', record.location),
    field('Work Arrangement', record.work_arrangement),
    field('Start Date', record.start_date),
    record.salary ? field('Salary', `$${Number(record.salary).toLocaleString()}`) : '',
    '',
    record.notes ? `## Notes\n\n${record.notes}` : '',
  ];

  const assocParts: string[] = [];
  if (associations['role_people']?.length) {
    assocParts.push(associationList('Roles', associations['role_people'], getObjectConfig('role')));
  }
  if (associations['core_activity_people']?.length) {
    assocParts.push(associationList('Core Activities', associations['core_activity_people'], getObjectConfig('core_activity')));
  }
  if (associations['software_people']?.length) {
    assocParts.push(associationList('Software', associations['software_people'], getObjectConfig('software')));
  }

  if (assocParts.length) {
    parts.push('## Associations', '', assocParts.join('\n\n'));
  }

  return lines(...parts);
}

export function exportRole(
  record: RecordData,
  associations: Record<string, RecordData[]>
): string {
  const parts = [
    `# ${record.title || 'Untitled Role'}`,
    '',
    statusLine(record.status as string),
    field('Brief Description', record.brief_description),
    '',
    record.description ? `## Description\n\n${record.description}` : '',
  ];

  const assocParts: string[] = [];
  if (associations['role_people']?.length) {
    assocParts.push(associationList('People', associations['role_people'], getObjectConfig('person')));
  }
  if (associations['role_subfunctions']?.length) {
    assocParts.push(associationList('Subfunctions', associations['role_subfunctions'], getObjectConfig('subfunction')));
  }
  if (associations['core_activity_roles']?.length) {
    assocParts.push(associationList('Core Activities', associations['core_activity_roles'], getObjectConfig('core_activity')));
  }

  if (assocParts.length) {
    parts.push('## Associations', '', assocParts.join('\n\n'));
  }

  return lines(...parts);
}

export function exportSoftware(
  record: RecordData,
  associations: Record<string, RecordData[]>
): string {
  const parts = [
    `# ${record.title || 'Untitled Software'}`,
    '',
    statusLine(record.status as string),
    field('URL', record.url),
    field('Category', Array.isArray(record.category) ? (record.category as string[]).join(', ') : record.category),
    field('Pricing Model', record.pricing_model),
    field('Billing Cycle', record.billing_cycle),
    record.monthly_cost ? field('Monthly Cost', `$${Number(record.monthly_cost).toLocaleString()}`) : '',
    record.annual_cost ? field('Annual Cost', `$${Number(record.annual_cost).toLocaleString()}`) : '',
    field('Number of Seats', record.number_of_seats),
    field('Renewal Date', record.renewal_date),
    '',
    record.description ? `## Description\n\n${record.description}` : '',
  ];

  const assocParts: string[] = [];
  if (associations['software_people']?.length) {
    assocParts.push(associationList('People', associations['software_people'], getObjectConfig('person')));
  }
  if (associations['software_roles']?.length) {
    assocParts.push(associationList('Roles', associations['software_roles'], getObjectConfig('role')));
  }
  if (associations['core_activity_software']?.length) {
    assocParts.push(associationList('Core Activities', associations['core_activity_software'], getObjectConfig('core_activity')));
  }

  if (assocParts.length) {
    parts.push('## Associations', '', assocParts.join('\n\n'));
  }

  return lines(...parts);
}

// ---- Dispatcher ----

const EXPORTERS: Record<string, (record: RecordData, associations: Record<string, RecordData[]>) => string> = {
  core_activity: exportCoreActivity,
  process: exportProcess,
  subfunction: exportSubfunction,
  function: exportFunction,
  person: exportPerson,
  role: exportRole,
  software: exportSoftware,
};

export function exportRecord(
  objectType: string,
  record: RecordData,
  associations: Record<string, RecordData[]>
): string {
  const exporter = EXPORTERS[objectType];
  if (!exporter) return `# ${(record.title as string) || 'Untitled'}\n\nExport not supported for type: ${objectType}`;
  return exporter(record, associations);
}

// ---- Workflow export ----

export interface WorkflowExportData {
  workflow: RecordData;
  phases: {
    phase: RecordData;
    processes: {
      process: RecordData;
      coreActivities: RecordData[];
    }[];
    handoffBlocks: RecordData[];
  }[];
}

export function exportWorkflow(data: WorkflowExportData): string {
  const { workflow, phases } = data;
  const parts = [
    `# ${workflow.title || 'Untitled Workflow'}`,
    '',
    workflow.description ? `${workflow.description}\n` : '',
  ];

  phases.forEach((phaseData, pi) => {
    const { phase, processes, handoffBlocks } = phaseData;
    parts.push(`## Phase ${pi + 1}: ${phase.title || 'Untitled Phase'}`);
    parts.push('');
    if (phase.description) parts.push(phase.description as string, '');

    processes.forEach((procData, pri) => {
      const { process, coreActivities } = procData;
      parts.push(`### ${pi + 1}.${pri + 1} ${process.title || 'Untitled Process'}`);
      parts.push('');
      if (process.status) parts.push(statusLine(process.status as string));
      if (process.trigger) parts.push(field('Trigger', process.trigger));
      if (process.end_state) parts.push(field('End State', process.end_state));
      if (process.description) parts.push('', process.description as string);
      parts.push('');

      if (coreActivities.length) {
        parts.push('**Core Activities:**', '');
        coreActivities.forEach((ca, cai) => {
          parts.push(`${cai + 1}. **${ca.title || 'Untitled'}** (${ca.status || 'No status'})`);
          if (ca.trigger) parts.push(`   - Trigger: ${ca.trigger}`);
          if (ca.end_state) parts.push(`   - End State: ${ca.end_state}`);
        });
        parts.push('');
      }
    });

    // Handoff blocks at end of phase
    if (handoffBlocks.length) {
      for (const hb of handoffBlocks) {
        parts.push(`> **Handoff:** ${hb.label || 'Unnamed handoff'}`, '');
      }
    }
  });

  return lines(...parts);
}

// ---- Function Chart full export ----

export interface FunctionChartExportData {
  functions: {
    func: RecordData;
    subfunctions: {
      sub: RecordData;
      coreActivities: RecordData[];
    }[];
  }[];
}

export function exportFunctionChart(data: FunctionChartExportData): string {
  const parts = ['# Function Chart', ''];

  data.functions.forEach((funcData) => {
    const { func, subfunctions } = funcData;
    parts.push(`## ${func.title || 'Untitled Function'}`);
    parts.push('');
    if (func.status) parts.push(statusLine(func.status as string));
    if (func.description) parts.push('', func.description as string);
    parts.push('');

    subfunctions.forEach((subData) => {
      const { sub, coreActivities } = subData;
      parts.push(`### ${sub.title || 'Untitled Subfunction'}`);
      parts.push('');
      if (sub.status) parts.push(statusLine(sub.status as string));
      parts.push('');

      if (coreActivities.length) {
        coreActivities.forEach((ca) => {
          parts.push(`- **${ca.title || 'Untitled'}** (${ca.status || 'No status'})`);
        });
        parts.push('');
      }
    });
  });

  return lines(...parts);
}

// ---- Helpers for download and clipboard ----

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}
