'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, X, Lock, Info } from 'lucide-react';
import { OBJECT_CONFIGS, type ObjectConfig } from '@/lib/object-config';
import {
  listCustomProperties,
  createCustomProperty,
  updateCustomProperty,
  deleteCustomProperty,
  reorderCustomProperties,
  type CustomPropertyDef,
} from '@/server/actions/settings';

const OBJECT_TYPES = [
  { value: 'function', label: 'Function' },
  { value: 'subfunction', label: 'Subfunction' },
  { value: 'process', label: 'Process' },
  { value: 'core_activity', label: 'Core Activity' },
  { value: 'person', label: 'Person' },
  { value: 'role', label: 'Role' },
  { value: 'software', label: 'Software' },
];

const PROPERTY_TYPES = [
  'text', 'number', 'date', 'select', 'multi-select', 'url', 'email', 'phone', 'currency', 'boolean',
];

const OPERATIONAL_TYPES = ['function', 'subfunction', 'process', 'core_activity'];

export default function ObjectConfigPage() {
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState('function');
  const [properties, setProperties] = useState<CustomPropertyDef[]>([]);
  const [loading, setLoading] = useState(false);

  // Add property form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('text');
  const [newOptions, setNewOptions] = useState('');

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<CustomPropertyDef | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const loadProperties = useCallback(async (type: string) => {
    setLoading(true);
    const result = await listCustomProperties(type);
    if (result.success) setProperties(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProperties(selectedType);
  }, [selectedType, loadProperties]);

  function handleAdd() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const opts = (newType === 'select' || newType === 'multi-select') && newOptions.trim()
        ? newOptions.split(',').map((o) => o.trim()).filter(Boolean)
        : undefined;
      const result = await createCustomProperty(selectedType, newName.trim(), newType, opts);
      if (result.success) {
        toast.success('Custom property created');
        setShowAddForm(false);
        setNewName('');
        setNewType('text');
        setNewOptions('');
        loadProperties(selectedType);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(prop: CustomPropertyDef) {
    startTransition(async () => {
      const result = await deleteCustomProperty(prop.id);
      if (result.success) {
        toast.success('Custom property deleted');
        setDeleteTarget(null);
        loadProperties(selectedType);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRename(id: string) {
    if (!editName.trim()) return;
    startTransition(async () => {
      const result = await updateCustomProperty(id, { property_name: editName.trim() });
      if (result.success) {
        toast.success('Property renamed');
        setEditingId(null);
        loadProperties(selectedType);
      } else {
        toast.error(result.error);
      }
    });
  }

  const config = OBJECT_CONFIGS[selectedType] as ObjectConfig | undefined;
  const isOperational = OPERATIONAL_TYPES.includes(selectedType);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Object Configuration" backHref="/settings" backLabel="Settings" />

      <div className="space-y-6 mt-4">
        <div className="space-y-2">
          <Label>Object Type</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBJECT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="properties">
          <TabsList>
            <TabsTrigger value="properties">Custom Properties</TabsTrigger>
            <TabsTrigger value="status">Status Options</TabsTrigger>
            <TabsTrigger value="associations">Association Visibility</TabsTrigger>
          </TabsList>

          {/* Custom Properties Tab */}
          <TabsContent value="properties" className="space-y-4 mt-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : properties.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No custom properties defined for this object type.
              </p>
            ) : (
              <div className="space-y-2">
                {properties.map((prop) => (
                  <div key={prop.id} className="flex items-center gap-2 rounded-md border p-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                    {editingId === prop.id ? (
                      <Input
                        autoFocus
                        className="h-8 flex-1"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRename(prop.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(prop.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      <span
                        className="flex-1 text-sm font-medium cursor-pointer hover:text-primary"
                        onClick={() => { setEditingId(prop.id); setEditName(prop.property_name); }}
                      >
                        {prop.property_name}
                      </span>
                    )}
                    <Badge variant="secondary" className="text-xs">{prop.property_type}</Badge>
                    {Array.isArray(prop.options) && (
                      <span className="text-xs text-muted-foreground">
                        {prop.options.length} options
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setDeleteTarget(prop)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showAddForm ? (
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Property name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(newType === 'select' || newType === 'multi-select') && (
                  <Input
                    placeholder="Options (comma-separated)"
                    value={newOptions}
                    onChange={(e) => setNewOptions(e.target.value)}
                  />
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAdd} disabled={isPending || !newName.trim()}>
                    Add Property
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Custom Property
              </Button>
            )}
          </TabsContent>

          {/* Status Options Tab */}
          <TabsContent value="status" className="space-y-4 mt-4">
            {isOperational ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Status options for operational objects cannot be customized
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Functions, Subfunctions, Processes, and Core Activities use a fixed lifecycle:
                      Draft, In Review, Active, Needs Update, Archived.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {config?.statusOptions.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-2 mb-3">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Status options for {config?.label}. These are configured in the object schema and apply across all records.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config?.statusOptions.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Association Visibility Tab */}
          <TabsContent value="associations" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Control which association sections appear in the Record View for {config?.label} records.
              Changes apply to all records of this type.
            </p>
            {config?.associations.length ? (
              <div className="space-y-2">
                {config.associations.map((assoc) => (
                  <label
                    key={assoc.junctionTable}
                    className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium">{assoc.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({assoc.targetLabel})
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No associations configured for this type.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.property_name}&rdquo;?
              All values for this property across all records will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
