import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { Download, FileCode, Terminal } from 'lucide-react';
import { SkillDownloadButton } from './skill-download-button';

export const metadata: Metadata = { title: 'Tools' };

const SKILL_FILES = [
  { name: 'SKILL.md', path: '/skills/ops-import/SKILL.md', description: 'Skill definition and workflow' },
  { name: 'yaml-schema.md', path: '/skills/ops-import/references/yaml-schema.md', description: 'Complete YAML schema reference' },
  { name: 'workflow-template.yaml', path: '/skills/ops-import/templates/workflow-template.yaml', description: 'Workflow YAML template' },
  { name: 'function-chart-template.yaml', path: '/skills/ops-import/templates/function-chart-template.yaml', description: 'Function Chart YAML template' },
];

export default function ToolsPage() {
  return (
    <div>
      <PageHeader title="Tools" />

      <div className="max-w-3xl space-y-8">
        {/* Ops Import Skill Card */}
        <div className="rounded-lg border">
          <div className="border-b p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Ops Import Skill</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  A Claude Code skill that generates valid structured YAML for importing
                  workflows and function charts into Ops Map. Describe a business operation
                  in natural language and get ready-to-import YAML.
                </p>
              </div>
              <SkillDownloadButton />
            </div>
          </div>

          {/* What it does */}
          <div className="border-b p-6">
            <h3 className="mb-3 text-sm font-medium">What it does</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-foreground">1.</span>
                Determines whether you need a Workflow or Function Chart
              </li>
              <li className="flex gap-2">
                <span className="text-foreground">2.</span>
                Asks a few clarifying questions about your operation
              </li>
              <li className="flex gap-2">
                <span className="text-foreground">3.</span>
                Generates valid YAML that passes Ops Map&apos;s import parser
              </li>
              <li className="flex gap-2">
                <span className="text-foreground">4.</span>
                Gives you import instructions to paste it into Ops Map
              </li>
            </ul>
          </div>

          {/* Installation */}
          <div className="border-b p-6">
            <h3 className="mb-3 text-sm font-medium">Installation</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="text-foreground font-medium">1. Download</span> the skill
                zip using the button above and extract it.
              </li>
              <li>
                <span className="text-foreground font-medium">2. Copy</span> the{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">ops-import</code>{' '}
                folder into your project:
                <pre className="mt-2 rounded bg-muted p-3 text-xs overflow-x-auto">
{`.agents/skills/ops-import/
├── SKILL.md
├── references/
│   └── yaml-schema.md
└── templates/
    ├── workflow-template.yaml
    └── function-chart-template.yaml`}
                </pre>
              </li>
              <li>
                <span className="text-foreground font-medium">3. Create</span> the symlink
                so Claude Code discovers the skill:
                <pre className="mt-2 rounded bg-muted p-3 text-xs overflow-x-auto">
{`mkdir -p .claude/skills
ln -s ../../.agents/skills/ops-import .claude/skills/ops-import`}
                </pre>
              </li>
              <li>
                <span className="text-foreground font-medium">4. Use it</span> in Claude Code
                by asking something like:{' '}
                <em>&ldquo;Generate a workflow for employee onboarding&rdquo;</em>
              </li>
            </ol>
          </div>

          {/* Individual files */}
          <div className="p-6">
            <h3 className="mb-3 text-sm font-medium">Individual files</h3>
            <div className="space-y-2">
              {SKILL_FILES.map((file) => (
                <a
                  key={file.path}
                  href={file.path}
                  download={file.name}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">{file.name}</span>
                    <span className="text-muted-foreground">— {file.description}</span>
                  </div>
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
