/**
 * Automated verification tests for Phase 2.5 — Structured YAML Import
 * Run with: npx tsx scripts/test-yaml-import.ts
 */

import {
  parseWorkflowYaml,
  parseFunctionChartYaml,
  detectImportFormat,
} from '../src/lib/yaml-import';
import {
  parseWorkflowMarkdown,
  parseFunctionChartMarkdown,
} from '../src/lib/markdown-import';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  if (match) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ---- Test 1: Parse a sample workflow YAML ----
console.log('\n=== Test 1: Parse Workflow YAML ===');
{
  const yaml = `
workflow:
  title: "Order Fulfillment"
  description: "End-to-end order processing"
  phases:
    - title: "Intake"
      description: "Receive and validate orders"
      processes:
        - title: "Receive Order"
          trigger: "Customer places order"
          end_state: "Order recorded in system"
          description: "Accept incoming orders"
          estimated_duration: "5 minutes"
          core_activities:
            - title: "Validate order details"
              trigger: "Order submitted"
              end_state: "Order validated"
            - title: "Check inventory"
              trigger: "Order validated"
              end_state: "Inventory confirmed"
        - title: "Approve Order"
          trigger: "Order validated"
          end_state: "Order approved"
      handoffs:
        - label: "Handoff to Processing"
    - title: "Processing"
      processes:
        - title: "Pick Items"
          core_activities:
            - title: "Locate items in warehouse"
        - title: "Pack Order"
    - title: "Shipping"
      processes:
        - title: "Ship Package"
          estimated_duration: "1 day"
      handoffs:
        - label: "Delivery to customer"
`;

  const result = parseWorkflowYaml(yaml);
  assert(result.success === true, 'Workflow YAML parses successfully');

  if (result.success) {
    assertEqual(result.data.title, 'Order Fulfillment', 'Workflow title correct');
    assertEqual(result.data.description, 'End-to-end order processing', 'Workflow description correct');
    assertEqual(result.data.phases.length, 3, '3 phases parsed');

    // Phase 1 checks
    assertEqual(result.data.phases[0].title, 'Intake', 'Phase 1 title correct');
    assertEqual(result.data.phases[0].description, 'Receive and validate orders', 'Phase 1 description correct');
    assertEqual(result.data.phases[0].processes.length, 2, 'Phase 1 has 2 processes');
    assertEqual(result.data.phases[0].handoffs.length, 1, 'Phase 1 has 1 handoff');
    assertEqual(result.data.phases[0].handoffs[0].label, 'Handoff to Processing', 'Handoff label correct');

    // Process details
    const proc1 = result.data.phases[0].processes[0];
    assertEqual(proc1.title, 'Receive Order', 'Process 1 title correct');
    assertEqual(proc1.trigger, 'Customer places order', 'Process 1 trigger correct');
    assertEqual(proc1.end_state, 'Order recorded in system', 'Process 1 end_state correct');
    assertEqual(proc1.description, 'Accept incoming orders', 'Process 1 description correct');
    assertEqual(proc1.estimated_duration, '5 minutes', 'Process 1 estimated_duration correct');
    assertEqual(proc1.coreActivities.length, 2, 'Process 1 has 2 core activities');

    // Core activity details
    assertEqual(proc1.coreActivities[0].title, 'Validate order details', 'CA 1 title correct');
    assertEqual(proc1.coreActivities[0].trigger, 'Order submitted', 'CA 1 trigger correct');
    assertEqual(proc1.coreActivities[0].end_state, 'Order validated', 'CA 1 end_state correct');

    // Total counts
    let totalProcesses = 0;
    let totalCAs = 0;
    let totalHandoffs = 0;
    for (const phase of result.data.phases) {
      totalHandoffs += phase.handoffs.length;
      for (const proc of phase.processes) {
        totalProcesses++;
        totalCAs += proc.coreActivities.length;
      }
    }
    assertEqual(totalProcesses, 5, '5 total processes');
    assertEqual(totalCAs, 3, '3 total core activities');
    assertEqual(totalHandoffs, 2, '2 total handoffs');
  }
}

// ---- Test 2: Parse a sample function chart YAML ----
console.log('\n=== Test 2: Parse Function Chart YAML ===');
{
  const yaml = `
functions:
  - title: "Finance"
    description: "Financial operations"
    subfunctions:
      - title: "Accounts Payable"
        description: "Handle outgoing payments"
        core_activities:
          - title: "Invoice Processing"
            trigger: "Invoice received"
            end_state: "Invoice approved"
          - title: "Payment Execution"
            trigger: "Invoice approved"
            end_state: "Payment sent"
      - title: "Accounts Receivable"
        core_activities:
          - title: "Send invoices to customers"
  - title: "Human Resources"
    subfunctions:
      - title: "Recruitment"
        core_activities:
          - title: "Screen applications"
          - title: "Conduct interviews"
      - title: "Onboarding"
  - title: "IT"
    description: "Technology services"
`;

  const result = parseFunctionChartYaml(yaml);
  assert(result.success === true, 'Function Chart YAML parses successfully');

  if (result.success) {
    assertEqual(result.data.functions.length, 3, '3 functions parsed');
    assertEqual(result.data.functions[0].title, 'Finance', 'Function 1 title correct');
    assertEqual(result.data.functions[0].description, 'Financial operations', 'Function 1 description correct');
    assertEqual(result.data.functions[0].subfunctions.length, 2, 'Finance has 2 subfunctions');
    assertEqual(result.data.functions[0].subfunctions[0].title, 'Accounts Payable', 'SF 1 title correct');
    assertEqual(result.data.functions[0].subfunctions[0].description, 'Handle outgoing payments', 'SF 1 description correct');
    assertEqual(result.data.functions[0].subfunctions[0].coreActivities.length, 2, 'AP has 2 core activities');
    assertEqual(result.data.functions[0].subfunctions[0].coreActivities[0].trigger, 'Invoice received', 'CA trigger correct');
    assertEqual(result.data.functions[0].subfunctions[0].coreActivities[0].end_state, 'Invoice approved', 'CA end_state correct');

    // Total counts
    let totalSFs = 0;
    let totalCAs = 0;
    for (const fn of result.data.functions) {
      for (const sf of fn.subfunctions) {
        totalSFs++;
        totalCAs += sf.coreActivities.length;
      }
    }
    assertEqual(totalSFs, 4, '4 total subfunctions');
    assertEqual(totalCAs, 5, '5 total core activities');
  }
}

// ---- Test 3: Auto-detection ----
console.log('\n=== Test 3: Format Auto-Detection ===');
{
  assertEqual(detectImportFormat('workflow:\n  title: Test'), 'yaml', 'Detects workflow YAML');
  assertEqual(detectImportFormat('functions:\n  - title: Test'), 'yaml', 'Detects function chart YAML');
  assertEqual(detectImportFormat('# My Heading\n## Sub'), 'markdown', 'Detects markdown');
  assertEqual(detectImportFormat('  workflow:\n  title: Test'), 'yaml', 'Detects YAML with leading whitespace');
  assertEqual(detectImportFormat('  # My Heading'), 'markdown', 'Detects markdown with leading whitespace');
  assertEqual(detectImportFormat('some random text'), 'unknown', 'Returns unknown for other content');
  assertEqual(detectImportFormat(''), 'unknown', 'Returns unknown for empty string');
}

// ---- Test 4: Validation error messages ----
console.log('\n=== Test 4: Validation Errors ===');
{
  // Missing required title
  const missingTitle = `
workflow:
  title: "Test"
  phases:
    - title: "Phase 1"
      processes:
        - trigger: "something"
`;
  const result1 = parseWorkflowYaml(missingTitle);
  assert(result1.success === false, 'Rejects process without title');
  if (!result1.success) {
    const hasPathInfo = result1.errors.some((e) => e.includes('title'));
    assert(hasPathInfo, 'Error message includes field info for missing title');
  }

  // Missing phases
  const missingPhases = `
workflow:
  title: "Test"
  phases: []
`;
  const result2 = parseWorkflowYaml(missingPhases);
  assert(result2.success === false, 'Rejects workflow with empty phases');
  if (!result2.success) {
    const hasMinError = result2.errors.some((e) => e.includes('at least 1'));
    assert(hasMinError, 'Error message mentions minimum requirement');
  }

  // Missing functions
  const missingFunctions = `
functions: []
`;
  const result3 = parseFunctionChartYaml(missingFunctions);
  assert(result3.success === false, 'Rejects function chart with empty functions');

  // Malformed YAML
  const badYaml = `
workflow:
  title: "Test
  phases:
    - title: unclosed quote
`;
  const result4 = parseWorkflowYaml(badYaml);
  assert(result4.success === false, 'Rejects malformed YAML');
  if (!result4.success) {
    const hasSyntaxError = result4.errors.some((e) => e.includes('YAML syntax error') || e.includes('syntax'));
    assert(hasSyntaxError, 'Error message indicates YAML syntax issue');
  }

  // Wrong structure (workflow when expecting function chart)
  const wrongStructure = `
workflow:
  title: "Test"
  phases:
    - title: "Phase"
`;
  const result5 = parseFunctionChartYaml(wrongStructure);
  assert(result5.success === false, 'Rejects workflow YAML as function chart');
}

// ---- Test 5: Round-trip equivalence ----
console.log('\n=== Test 5: Round-Trip Equivalence (Markdown vs YAML) ===');
{
  // Equivalent markdown and YAML for a workflow
  const workflowMd = `# Order Process
## Phase 1: Intake
### 1.1 Receive Order
**Trigger:** Customer submits
**End State:** Order logged
**Core Activities:**
1. **Validate details**
   - Trigger: Form submitted
   - End State: Details valid
> **Handoff:** Send to processing
`;

  const workflowYaml = `
workflow:
  title: "Order Process"
  phases:
    - title: "Intake"
      processes:
        - title: "Receive Order"
          trigger: "Customer submits"
          end_state: "Order logged"
          core_activities:
            - title: "Validate details"
              trigger: "Form submitted"
              end_state: "Details valid"
      handoffs:
        - label: "Send to processing"
`;

  const mdResult = parseWorkflowMarkdown(workflowMd);
  const yamlResult = parseWorkflowYaml(workflowYaml);

  assert(yamlResult.success === true, 'YAML parses for round-trip test');
  if (yamlResult.success) {
    assertEqual(mdResult.title, yamlResult.data.title, 'Titles match');
    assertEqual(mdResult.phases.length, yamlResult.data.phases.length, 'Phase counts match');
    assertEqual(mdResult.phases[0].title, yamlResult.data.phases[0].title, 'Phase titles match');
    assertEqual(
      mdResult.phases[0].processes.length,
      yamlResult.data.phases[0].processes.length,
      'Process counts match'
    );
    assertEqual(
      mdResult.phases[0].processes[0].title,
      yamlResult.data.phases[0].processes[0].title,
      'Process titles match'
    );
    assertEqual(
      mdResult.phases[0].processes[0].trigger,
      yamlResult.data.phases[0].processes[0].trigger,
      'Process triggers match'
    );
    assertEqual(
      mdResult.phases[0].processes[0].end_state,
      yamlResult.data.phases[0].processes[0].end_state,
      'Process end_states match'
    );
    assertEqual(
      mdResult.phases[0].processes[0].coreActivities.length,
      yamlResult.data.phases[0].processes[0].coreActivities.length,
      'CA counts match'
    );
    assertEqual(
      mdResult.phases[0].processes[0].coreActivities[0].title,
      yamlResult.data.phases[0].processes[0].coreActivities[0].title,
      'CA titles match'
    );
    assertEqual(
      mdResult.phases[0].processes[0].coreActivities[0].trigger,
      yamlResult.data.phases[0].processes[0].coreActivities[0].trigger,
      'CA triggers match'
    );
    assertEqual(
      mdResult.phases[0].processes[0].coreActivities[0].end_state,
      yamlResult.data.phases[0].processes[0].coreActivities[0].end_state,
      'CA end_states match'
    );
    assertEqual(
      mdResult.phases[0].handoffs.length,
      yamlResult.data.phases[0].handoffs.length,
      'Handoff counts match'
    );
    assertEqual(
      mdResult.phases[0].handoffs[0].label,
      yamlResult.data.phases[0].handoffs[0].label,
      'Handoff labels match'
    );
  }

  // Equivalent function chart
  const fcMd = `## Finance
Financial operations
### Accounts Payable
- **Invoice Processing**
- **Payment Execution**
## IT
### Support
- **Handle tickets**
`;

  const fcYaml = `
functions:
  - title: "Finance"
    description: "Financial operations"
    subfunctions:
      - title: "Accounts Payable"
        core_activities:
          - title: "Invoice Processing"
          - title: "Payment Execution"
  - title: "IT"
    subfunctions:
      - title: "Support"
        core_activities:
          - title: "Handle tickets"
`;

  const fcMdResult = parseFunctionChartMarkdown(fcMd);
  const fcYamlResult = parseFunctionChartYaml(fcYaml);

  assert(fcYamlResult.success === true, 'FC YAML parses for round-trip test');
  if (fcYamlResult.success) {
    assertEqual(fcMdResult.functions.length, fcYamlResult.data.functions.length, 'Function counts match');
    assertEqual(fcMdResult.functions[0].title, fcYamlResult.data.functions[0].title, 'Function titles match');
    assertEqual(fcMdResult.functions[0].description, fcYamlResult.data.functions[0].description, 'Function descriptions match');
    assertEqual(
      fcMdResult.functions[0].subfunctions.length,
      fcYamlResult.data.functions[0].subfunctions.length,
      'Subfunction counts match'
    );
    assertEqual(
      fcMdResult.functions[0].subfunctions[0].coreActivities.length,
      fcYamlResult.data.functions[0].subfunctions[0].coreActivities.length,
      'CA counts match in FC'
    );
    assertEqual(
      fcMdResult.functions[0].subfunctions[0].coreActivities[0].title,
      fcYamlResult.data.functions[0].subfunctions[0].coreActivities[0].title,
      'CA titles match in FC'
    );
  }
}

// ---- Test 6: Optional fields omitted ----
console.log('\n=== Test 6: Optional Fields Omitted ===');
{
  const minimalWorkflow = `
workflow:
  title: "Minimal"
  phases:
    - title: "Phase 1"
`;
  const result = parseWorkflowYaml(minimalWorkflow);
  assert(result.success === true, 'Minimal workflow (no processes/handoffs) parses');
  if (result.success) {
    assertEqual(result.data.phases[0].processes.length, 0, 'No processes when omitted');
    assertEqual(result.data.phases[0].handoffs.length, 0, 'No handoffs when omitted');
    assertEqual(result.data.description, undefined, 'No description when omitted');
  }

  const minimalFC = `
functions:
  - title: "Ops"
`;
  const result2 = parseFunctionChartYaml(minimalFC);
  assert(result2.success === true, 'Minimal function chart (no subfunctions) parses');
  if (result2.success) {
    assertEqual(result2.data.functions[0].subfunctions.length, 0, 'No subfunctions when omitted');
  }
}

// ---- Summary ----
console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
