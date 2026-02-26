/**
 * Verify that the YAML examples in the ops-import skill schema reference
 * parse successfully through the actual import parsers.
 * Run with: npx tsx scripts/test-skill-examples.ts
 */

import { readFileSync } from 'fs';
import { parseWorkflowYaml, parseFunctionChartYaml } from '../src/lib/yaml-import';

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

// Read the schema reference and extract YAML code blocks
const schemaRef = readFileSync('.agents/skills/ops-import/references/yaml-schema.md', 'utf-8');

// Extract the workflow example (the large annotated one)
const workflowMatch = schemaRef.match(/### Workflow Example[\s\S]*?```yaml\n([\s\S]*?)```/);
const fcMatch = schemaRef.match(/### Function Chart Example[\s\S]*?```yaml\n([\s\S]*?)```/);

console.log('\n=== Test: Workflow Example from Schema Reference ===');
if (workflowMatch) {
  const yaml = workflowMatch[1];
  const result = parseWorkflowYaml(yaml);
  assert(result.success === true, 'Workflow example parses successfully');
  if (result.success) {
    assert(result.data.title === 'Employee Onboarding', 'Title is correct');
    assert(result.data.phases.length === 3, 'Has 3 phases');

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
    assert(totalProcesses >= 5, `Has ${totalProcesses} processes (>= 5)`);
    assert(totalCAs >= 10, `Has ${totalCAs} core activities (>= 10)`);
    assert(totalHandoffs >= 2, `Has ${totalHandoffs} handoffs (>= 2)`);

    // Check estimated_duration is parsed
    const firstProc = result.data.phases[0].processes[0];
    assert(firstProc.estimated_duration === '3-5 business days', 'estimated_duration parsed');

    // Check triggers and end_states
    assert(firstProc.trigger !== undefined, 'Process trigger parsed');
    assert(firstProc.end_state !== undefined, 'Process end_state parsed');
    assert(firstProc.coreActivities[0].trigger !== undefined, 'CA trigger parsed');
    assert(firstProc.coreActivities[0].end_state !== undefined, 'CA end_state parsed');
  } else {
    console.error('  Errors:', result.errors);
  }
} else {
  console.error('  FAIL: Could not extract workflow example from schema reference');
  failed++;
}

console.log('\n=== Test: Function Chart Example from Schema Reference ===');
if (fcMatch) {
  const yaml = fcMatch[1];
  const result = parseFunctionChartYaml(yaml);
  assert(result.success === true, 'Function Chart example parses successfully');
  if (result.success) {
    assert(result.data.functions.length === 3, 'Has 3 functions');

    let totalSFs = 0;
    let totalCAs = 0;
    for (const fn of result.data.functions) {
      for (const sf of fn.subfunctions) {
        totalSFs++;
        totalCAs += sf.coreActivities.length;
      }
    }
    assert(totalSFs >= 6, `Has ${totalSFs} subfunctions (>= 6)`);
    assert(totalCAs >= 15, `Has ${totalCAs} core activities (>= 15)`);

    // Check descriptions
    assert(result.data.functions[0].description !== undefined, 'Function description parsed');
    assert(result.data.functions[0].subfunctions[0].description !== undefined, 'Subfunction description parsed');

    // Check triggers and end_states on CAs
    const firstCA = result.data.functions[0].subfunctions[0].coreActivities[0];
    assert(firstCA.trigger !== undefined, 'CA trigger parsed');
    assert(firstCA.end_state !== undefined, 'CA end_state parsed');
  } else {
    console.error('  Errors:', result.errors);
  }
} else {
  console.error('  FAIL: Could not extract function chart example from schema reference');
  failed++;
}

// ---- Summary ----
console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
