import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Terminal, ArrowRight } from 'lucide-react';

export const metadata: Metadata = { title: 'Tools' };

const TOOLS = [
  {
    slug: 'ops-import-skill',
    name: 'Ops Import Skill',
    description:
      'A Claude Code skill that generates valid structured YAML for importing workflows and function charts into Ops Map.',
    icon: Terminal,
  },
];

export default function ToolsPage() {
  return (
    <div>
      <PageHeader title="Tools" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group rounded-lg border p-5 transition-colors hover:bg-accent"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="font-semibold">{tool.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {tool.description}
              </p>
              <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                View details
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
