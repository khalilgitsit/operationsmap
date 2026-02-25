'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { getCompanyProfile, updateCompanyProfile, type CompanyProfile } from '@/server/actions/settings';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Consulting',
  'Real Estate',
  'Media & Entertainment',
  'Transportation',
  'Energy',
  'Agriculture',
  'Non-Profit',
  'Government',
  'Other',
];

export default function CompanyProfilePage() {
  const [isPending, startTransition] = useTransition();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    industry: '' as string | null,
    revenue: '' as string,
    location: '' as string,
    key_objectives: '' as string,
    company_description: '' as string,
    biggest_pains: '' as string,
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const result = await getCompanyProfile();
    if (result.success) {
      setProfile(result.data);
      setForm({
        name: result.data.name || '',
        industry: result.data.industry || '',
        revenue: result.data.revenue ? String(result.data.revenue) : '',
        location: result.data.location || '',
        key_objectives: result.data.key_objectives || '',
        company_description: result.data.company_description || '',
        biggest_pains: result.data.biggest_pains || '',
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleSave() {
    startTransition(async () => {
      const result = await updateCompanyProfile({
        name: form.name,
        industry: form.industry || null,
        revenue: form.revenue ? Number(form.revenue) : null,
        location: form.location || null,
        key_objectives: form.key_objectives || null,
        company_description: form.company_description || null,
        biggest_pains: form.biggest_pains || null,
      });
      if (result.success) {
        toast.success('Company profile saved');
      } else {
        toast.error(result.error);
      }
    });
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Company Profile" backHref="/settings" backLabel="Settings" />
        <div className="space-y-6 mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Company Profile" backHref="/settings" backLabel="Settings" />

      <div className="space-y-6 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Company Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Your company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={form.industry || ''}
            onValueChange={(v) => setForm((f) => ({ ...f, industry: v }))}
          >
            <SelectTrigger id="industry">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="revenue">Revenue</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
            <Input
              id="revenue"
              type="number"
              className="pl-7"
              value={form.revenue}
              onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
              placeholder="Annual revenue"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Employee Count</Label>
          <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 text-sm">
            {profile?.employeeCount ?? 0} {(profile?.employeeCount ?? 0) === 1 ? 'person' : 'people'}
          </div>
          <p className="text-xs text-muted-foreground">Auto-calculated from People records</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location(s)</Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="e.g., New York, London"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="key_objectives">Key Objectives</Label>
          <Textarea
            id="key_objectives"
            value={form.key_objectives}
            onChange={(e) => setForm((f) => ({ ...f, key_objectives: e.target.value }))}
            placeholder="Key business objectives..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_description">Company Description</Label>
          <Textarea
            id="company_description"
            value={form.company_description}
            onChange={(e) => setForm((f) => ({ ...f, company_description: e.target.value }))}
            placeholder="Describe your company..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="biggest_pains">Biggest Pains</Label>
          <Textarea
            id="biggest_pains"
            value={form.biggest_pains}
            onChange={(e) => setForm((f) => ({ ...f, biggest_pains: e.target.value }))}
            placeholder="Top operational challenges..."
            rows={4}
          />
        </div>

        <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
          {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
