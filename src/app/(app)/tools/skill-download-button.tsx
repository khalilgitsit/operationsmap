'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function SkillDownloadButton() {
  return (
    <Button asChild>
      <a href="/skills/ops-import-skill.zip" download="ops-import-skill.zip">
        <Download className="mr-2 h-4 w-4" />
        Download
      </a>
    </Button>
  );
}
