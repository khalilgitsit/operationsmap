/**
 * Structured YAML Import Parser
 *
 * Provides an unambiguous, validatable format optimized for LLM-generated content.
 * Parses YAML into the same ParsedWorkflow / ParsedFunctionChart types used by
 * the markdown parser, so the tree preview, summary counts, and import server
 * actions all work unchanged.
 *
 * Workflow YAML format:
 *   workflow:
 *     title: "Workflow Title"
 *     description: "optional"
 *     phases:
 *       - title: "Phase Title"
 *         description: "optional"
 *         processes:
 *           - title: "Process Title"
 *             trigger: "optional"
 *             end_state: "optional"
 *             description: "optional"
 *             estimated_duration: "optional"
 *             core_activities:
 *               - title: "Activity Title"
 *                 trigger: "optional"
 *                 end_state: "optional"
 *         handoffs:
 *           - label: "Handoff label"
 *
 * Function Chart YAML format:
 *   functions:
 *     - title: "Function Title"
 *       description: "optional"
 *       subfunctions:
 *         - title: "Subfunction Title"
 *           description: "optional"
 *           core_activities:
 *             - title: "Activity Title"
 *               trigger: "optional"
 *               end_state: "optional"
 */

import { z } from 'zod';
import { parse as parseYaml, YAMLParseError } from 'yaml';
import type {
  ParsedCoreActivity,
  ParsedSubfunction,
  ParsedFunction,
  ParsedFunctionChart,
  ParsedProcess,
  ParsedHandoff,
  ParsedPhase,
  ParsedWorkflow,
} from './markdown-import';

// ---- Zod Schemas ----

const CoreActivitySchema = z.object({
  title: z.string({ error: 'title is required and must be a string' }),
  trigger: z.string().optional(),
  end_state: z.string().optional(),
});

const HandoffSchema = z.object({
  label: z.string({ error: 'label is required and must be a string' }),
});

const ProcessSchema = z.object({
  title: z.string({ error: 'title is required and must be a string' }),
  trigger: z.string().optional(),
  end_state: z.string().optional(),
  description: z.string().optional(),
  estimated_duration: z.string().optional(),
  core_activities: z.array(CoreActivitySchema).optional(),
});

const PhaseSchema = z.object({
  title: z.string({ error: 'title is required and must be a string' }),
  description: z.string().optional(),
  processes: z.array(ProcessSchema).optional(),
  handoffs: z.array(HandoffSchema).optional(),
});

const WorkflowYamlSchema = z.object({
  workflow: z.object({
    title: z.string({ error: 'title is required and must be a string' }),
    description: z.string().optional(),
    phases: z
      .array(PhaseSchema)
      .min(1, { message: 'phases must contain at least 1 item' }),
  }),
});

const SubfunctionSchema = z.object({
  title: z.string({ error: 'title is required and must be a string' }),
  description: z.string().optional(),
  core_activities: z.array(CoreActivitySchema).optional(),
});

const FunctionSchema = z.object({
  title: z.string({ error: 'title is required and must be a string' }),
  description: z.string().optional(),
  subfunctions: z.array(SubfunctionSchema).optional(),
});

const FunctionChartYamlSchema = z.object({
  functions: z
    .array(FunctionSchema)
    .min(1, { message: 'functions must contain at least 1 item' }),
});

// ---- Format detection ----

export function detectImportFormat(
  text: string
): 'yaml' | 'markdown' | 'unknown' {
  const trimmed = text.trimStart();
  if (trimmed.startsWith('workflow:') || trimmed.startsWith('functions:')) {
    return 'yaml';
  }
  if (trimmed.startsWith('#')) {
    return 'markdown';
  }
  return 'unknown';
}

// ---- Error formatting helpers ----

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    // Replace numeric indices with bracket notation for readability
    const readablePath = path.replace(/\.(\d+)\./g, '[$1].').replace(/\.(\d+)$/, '[$1]');
    return `${readablePath}: ${issue.message}`;
  });
}

// ---- YAML → Parsed types converters ----

function convertCoreActivities(
  activities?: z.infer<typeof CoreActivitySchema>[]
): ParsedCoreActivity[] {
  if (!activities) return [];
  return activities.map((ca) => ({
    title: ca.title,
    trigger: ca.trigger,
    end_state: ca.end_state,
  }));
}

function convertWorkflowData(
  data: z.infer<typeof WorkflowYamlSchema>
): ParsedWorkflow {
  const wf = data.workflow;
  return {
    title: wf.title,
    description: wf.description,
    phases: wf.phases.map(
      (phase): ParsedPhase => ({
        title: phase.title,
        description: phase.description,
        processes: (phase.processes || []).map(
          (proc): ParsedProcess => ({
            title: proc.title,
            trigger: proc.trigger,
            end_state: proc.end_state,
            description: proc.description,
            estimated_duration: proc.estimated_duration,
            coreActivities: convertCoreActivities(proc.core_activities),
          })
        ),
        handoffs: (phase.handoffs || []).map(
          (h): ParsedHandoff => ({ label: h.label })
        ),
      })
    ),
  };
}

function convertFunctionChartData(
  data: z.infer<typeof FunctionChartYamlSchema>
): ParsedFunctionChart {
  return {
    functions: data.functions.map(
      (fn): ParsedFunction => ({
        title: fn.title,
        description: fn.description,
        subfunctions: (fn.subfunctions || []).map(
          (sf): ParsedSubfunction => ({
            title: sf.title,
            description: sf.description,
            coreActivities: convertCoreActivities(sf.core_activities),
          })
        ),
      })
    ),
  };
}

// ---- Public parsers ----

export type YamlParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function parseWorkflowYaml(
  text: string
): YamlParseResult<ParsedWorkflow> {
  // Step 1: Parse raw YAML
  let rawData: unknown;
  try {
    rawData = parseYaml(text);
  } catch (err) {
    if (err instanceof YAMLParseError) {
      return {
        success: false,
        errors: [`YAML syntax error: ${err.message}`],
      };
    }
    return {
      success: false,
      errors: ['Failed to parse YAML content'],
    };
  }

  // Step 2: Validate against Zod schema
  const result = WorkflowYamlSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }

  // Step 3: Convert to ParsedWorkflow
  return {
    success: true,
    data: convertWorkflowData(result.data),
  };
}

export function parseFunctionChartYaml(
  text: string
): YamlParseResult<ParsedFunctionChart> {
  // Step 1: Parse raw YAML
  let rawData: unknown;
  try {
    rawData = parseYaml(text);
  } catch (err) {
    if (err instanceof YAMLParseError) {
      return {
        success: false,
        errors: [`YAML syntax error: ${err.message}`],
      };
    }
    return {
      success: false,
      errors: ['Failed to parse YAML content'],
    };
  }

  // Step 2: Validate against Zod schema
  const result = FunctionChartYamlSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }

  // Step 3: Convert to ParsedFunctionChart
  return {
    success: true,
    data: convertFunctionChartData(result.data),
  };
}
