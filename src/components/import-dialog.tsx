'use client';

import { useState, useTransition, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  ArrowRightLeft,
  AlertCircle,
} from 'lucide-react';
import {
  parseFunctionChartMarkdown,
  parseWorkflowMarkdown,
  functionChartToTree,
  workflowToTree,
  countFunctionChartItems,
  countWorkflowItems,
  type ImportTreeNode,
  type ParsedFunctionChart,
  type ParsedWorkflow,
  type ImportScope,
} from '@/lib/markdown-import';
import {
  parseWorkflowYaml,
  parseFunctionChartYaml,
  detectImportFormat,
} from '@/lib/yaml-import';
import { importFunctionChart, importWorkflow } from '@/server/actions/import';
import { ScrollArea } from '@/components/ui/scroll-area';

type ImportType = 'function_chart' | 'workflow';
type InputMode = 'paste' | 'upload';
type FormatMode = 'markdown' | 'yaml';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importType: ImportType;
  onImported: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  importType,
  onImported,
}: ImportDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [formatMode, setFormatMode] = useState<FormatMode>('markdown');
  const [contentText, setContentText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [scope, setScope] = useState<ImportScope>(
    importType === 'function_chart' ? 'entire_chart' : 'entire_workflow'
  );
  const [parsedFC, setParsedFC] = useState<ParsedFunctionChart | null>(null);
  const [parsedWF, setParsedWF] = useState<ParsedWorkflow | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  // Track whether user has manually selected a format after auto-detection
  const userManuallySelectedFormat = useRef(false);

  const reset = useCallback(() => {
    setContentText('');
    setFileName(null);
    setParsedFC(null);
    setParsedWF(null);
    setParseError(null);
    setStep('input');
    setInputMode('paste');
    setFormatMode('markdown');
    setScope(importType === 'function_chart' ? 'entire_chart' : 'entire_workflow');
    userManuallySelectedFormat.current = false;
  }, [importType]);

  const autoDetectFormat = useCallback(
    (text: string) => {
      if (userManuallySelectedFormat.current) return;
      const detected = detectImportFormat(text);
      if (detected === 'yaml') {
        setFormatMode('yaml');
      } else if (detected === 'markdown') {
        setFormatMode('markdown');
      }
    },
    []
  );

  const handleContentChange = (text: string) => {
    const wasEmpty = !contentText.trim();
    setContentText(text);
    // Auto-detect format when content goes from empty to non-empty
    if (wasEmpty && text.trim()) {
      autoDetectFormat(text);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContentText(text);
      // Auto-detect on file upload
      autoDetectFormat(text);
    };
    reader.readAsText(file);
  };

  const handleFormatSelect = (mode: FormatMode) => {
    setFormatMode(mode);
    userManuallySelectedFormat.current = true;
  };

  const handleParse = () => {
    if (!contentText.trim()) {
      setParseError('Please enter or upload content.');
      return;
    }

    setParseError(null);

    try {
      if (formatMode === 'yaml') {
        // YAML parsing
        if (importType === 'function_chart') {
          const result = parseFunctionChartYaml(contentText);
          if (!result.success) {
            setParseError(result.errors.join('\n'));
            return;
          }
          let parsed = result.data;
          // Apply scope filtering
          if (scope === 'single_function' && parsed.functions.length > 1) {
            parsed = { functions: [parsed.functions[0]] };
          }
          if (scope === 'single_subfunction') {
            const firstSf = parsed.functions[0]?.subfunctions?.[0];
            if (firstSf) {
              parsed = {
                functions: [
                  {
                    title: parsed.functions[0].title,
                    subfunctions: [firstSf],
                  },
                ],
              };
            }
          }
          setParsedFC(parsed);
        } else {
          const result = parseWorkflowYaml(contentText);
          if (!result.success) {
            setParseError(result.errors.join('\n'));
            return;
          }
          setParsedWF(result.data);
        }
      } else {
        // Markdown parsing
        if (importType === 'function_chart') {
          const parsed = parseFunctionChartMarkdown(contentText);
          if (parsed.functions.length === 0) {
            setParseError(
              'No functions found in the markdown. Expected H2 (## ) headings for functions.'
            );
            return;
          }
          // Apply scope filtering
          if (scope === 'single_function' && parsed.functions.length > 1) {
            parsed.functions = [parsed.functions[0]];
          }
          if (scope === 'single_subfunction') {
            const firstSf = parsed.functions[0]?.subfunctions?.[0];
            if (firstSf) {
              parsed.functions = [
                {
                  title: parsed.functions[0].title,
                  subfunctions: [firstSf],
                },
              ];
            }
          }
          setParsedFC(parsed);
        } else {
          const parsed = parseWorkflowMarkdown(contentText);
          if (parsed.phases.length === 0) {
            setParseError(
              'No phases found in the markdown. Expected H2 (## ) headings for phases.'
            );
            return;
          }
          setParsedWF(parsed);
        }
      }
      setStep('preview');
    } catch {
      setParseError('Failed to parse the content. Please check the format.');
    }
  };

  const handleImport = () => {
    startTransition(async () => {
      try {
        if (importType === 'function_chart' && parsedFC) {
          const result = await importFunctionChart(parsedFC);
          if (result.success) {
            const {
              functionsCreated,
              subfunctionsCreated,
              coreActivitiesCreated,
            } = result.data;
            toast.success(
              `Imported ${functionsCreated} function${functionsCreated !== 1 ? 's' : ''}, ${subfunctionsCreated} subfunction${subfunctionsCreated !== 1 ? 's' : ''}, ${coreActivitiesCreated} core activit${coreActivitiesCreated !== 1 ? 'ies' : 'y'}`
            );
            onImported();
            onOpenChange(false);
            reset();
          } else {
            toast.error(result.error || 'Import failed');
          }
        } else if (importType === 'workflow' && parsedWF) {
          const result = await importWorkflow(parsedWF);
          if (result.success) {
            const { phasesCreated, processesCreated, coreActivitiesCreated } =
              result.data;
            toast.success(
              `Imported ${phasesCreated} phase${phasesCreated !== 1 ? 's' : ''}, ${processesCreated} process${processesCreated !== 1 ? 'es' : ''}, ${coreActivitiesCreated} core activit${coreActivitiesCreated !== 1 ? 'ies' : 'y'}`
            );
            onImported();
            onOpenChange(false);
            reset();
          } else {
            toast.error(result.error || 'Import failed');
          }
        }
      } catch {
        toast.error('An unexpected error occurred during import');
      }
    });
  };

  const treeNodes =
    importType === 'function_chart' && parsedFC
      ? functionChartToTree(parsedFC)
      : importType === 'workflow' && parsedWF
        ? workflowToTree(parsedWF)
        : [];

  const summary =
    importType === 'function_chart' && parsedFC
      ? countFunctionChartItems(parsedFC)
      : importType === 'workflow' && parsedWF
        ? countWorkflowItems(parsedWF)
        : null;

  const placeholderText =
    formatMode === 'yaml'
      ? importType === 'function_chart'
        ? 'functions:\n  - title: "Finance"\n    subfunctions:\n      - title: "Accounts Payable"\n        core_activities:\n          - title: "Invoice Processing"'
        : 'workflow:\n  title: "My Workflow"\n  phases:\n    - title: "Intake"\n      processes:\n        - title: "Receive Request"\n          core_activities:\n            - title: "Review submission"'
      : importType === 'function_chart'
        ? '## Finance\n### Accounts Payable\n- **Invoice Processing** (Draft)\n- **Payment Approval** (Draft)'
        : '# My Workflow\n## Phase 1: Intake\n### 1.1 Receive Request\n**Core Activities:**\n1. **Review submission** (Draft)';

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Import{' '}
            {importType === 'function_chart' ? 'Function Chart' : 'Workflow'}
          </DialogTitle>
          <DialogDescription>
            {step === 'input'
              ? 'Paste content or upload a file. The structure will be parsed and previewed before importing.'
              : 'Review the parsed structure below. All items will be created with Draft status.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' ? (
          <div className="space-y-4 flex-1 min-h-0">
            {/* Format toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={formatMode === 'markdown' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFormatSelect('markdown')}
              >
                Markdown
              </Button>
              <Button
                variant={formatMode === 'yaml' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFormatSelect('yaml')}
              >
                Structured YAML
              </Button>
            </div>

            {/* Input mode toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={inputMode === 'paste' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMode('paste')}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                Paste
              </Button>
              <Button
                variant={inputMode === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMode('upload')}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload File
              </Button>
            </div>

            {inputMode === 'paste' ? (
              <div className="space-y-2">
                <Label htmlFor="content-input">
                  {formatMode === 'yaml' ? 'YAML' : 'Markdown'} Content
                </Label>
                <Textarea
                  id="content-input"
                  placeholder={placeholderText}
                  value={contentText}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="file-input">Upload File</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    id="file-input"
                    type="file"
                    accept=".md,.markdown,.txt,.yaml,.yml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {fileName
                        ? fileName
                        : 'Click to select a file (.md, .yaml, .yml, .txt)'}
                    </span>
                  </label>
                </div>
                {contentText && (
                  <p className="text-xs text-muted-foreground">
                    {contentText.split('\n').length} lines loaded
                  </p>
                )}
              </div>
            )}

            {/* Scope selector */}
            {importType === 'function_chart' && (
              <div className="space-y-2">
                <Label>Import Scope</Label>
                <Select
                  value={scope}
                  onValueChange={(v) => setScope(v as ImportScope)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entire_chart">Entire Chart</SelectItem>
                    <SelectItem value="single_function">
                      First Function Only
                    </SelectItem>
                    <SelectItem value="single_subfunction">
                      First Subfunction Only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {parseError && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="whitespace-pre-wrap">{parseError}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 space-y-3">
            {/* Summary */}
            {summary && (
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                {'functions' in summary ? (
                  <span>
                    {summary.functions} function
                    {summary.functions !== 1 ? 's' : ''},{' '}
                    {summary.subfunctions} subfunction
                    {summary.subfunctions !== 1 ? 's' : ''},{' '}
                    {summary.coreActivities} core activit
                    {summary.coreActivities !== 1 ? 'ies' : 'y'}
                  </span>
                ) : (
                  <span>
                    {summary.phases} phase{summary.phases !== 1 ? 's' : ''},{' '}
                    {summary.processes} process
                    {summary.processes !== 1 ? 'es' : ''},{' '}
                    {summary.coreActivities} core activit
                    {summary.coreActivities !== 1 ? 'ies' : 'y'}
                    {summary.handoffs > 0 &&
                      `, ${summary.handoffs} handoff${summary.handoffs !== 1 ? 's' : ''}`}
                  </span>
                )}
                <span className="text-muted-foreground ml-2">
                  (all as Draft)
                </span>
              </div>
            )}

            {/* Tree preview */}
            <ScrollArea className="h-[300px] border rounded-md p-3">
              <div className="space-y-0.5">
                {treeNodes.map((node, idx) => (
                  <TreeNodeView key={idx} node={node} depth={0} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'preview' && (
            <Button
              variant="outline"
              onClick={() => setStep('input')}
              disabled={isPending}
            >
              Back
            </Button>
          )}
          {step === 'input' ? (
            <Button onClick={handleParse} disabled={!contentText.trim()}>
              <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
              Parse & Preview
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={isPending}>
              {isPending ? (
                <>
                  <span className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Import
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Tree node renderer ----

const TREE_NODE_COLORS: Record<string, string> = {
  function: 'text-[#2364b9]',
  subfunction: 'text-[#0d5e4b]',
  core_activity: 'text-[#984c0c]',
  phase: 'text-[#4a2d82]',
  process: 'text-[#2364b9]',
  handoff: 'text-[#856404]',
};

const TREE_NODE_LABELS: Record<string, string> = {
  function: 'Fn',
  subfunction: 'SF',
  core_activity: 'CA',
  phase: 'Ph',
  process: 'Pr',
  handoff: 'HO',
};

function TreeNodeView({
  node,
  depth,
}: {
  node: ImportTreeNode;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  const Icon = hasChildren ? (expanded ? ChevronDown : ChevronRight) : File;
  const FolderIcon = hasChildren ? Folder : File;

  return (
    <div>
      <button
        className="flex items-center gap-1.5 py-0.5 hover:bg-muted/50 rounded px-1 w-full text-left text-sm"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-3.5" />
        )}
        <FolderIcon
          className={`h-3.5 w-3.5 shrink-0 ${TREE_NODE_COLORS[node.type] || 'text-muted-foreground'}`}
        />
        <span
          className={`text-[10px] font-mono px-1 py-0.5 rounded ${TREE_NODE_COLORS[node.type] || ''} bg-muted`}
        >
          {TREE_NODE_LABELS[node.type] || '??'}
        </span>
        <span className="truncate">{node.title}</span>
        {node.status && (
          <span className="text-xs text-muted-foreground ml-auto shrink-0">
            {node.status}
          </span>
        )}
      </button>
      {expanded &&
        node.children.map((child, idx) => (
          <TreeNodeView key={idx} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}
