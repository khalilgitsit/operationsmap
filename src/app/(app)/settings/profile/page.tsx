'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProfile, updateProfile, getAvatarUploadUrl, type UserProfile } from '@/server/actions/profile';
import { createClient } from '@/lib/supabase/client';

const COMMON_TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [
      'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
      'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
      'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney',
    ];
  }
})();

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProfile().then((result) => {
      if (result.success) setProfile(result.data);
      setLoading(false);
    });
  }, []);

  function handleSave() {
    if (!profile) return;
    startTransition(async () => {
      const result = await updateProfile({
        display_name: profile.display_name,
        timezone: profile.timezone,
        location: profile.location,
        avatar_url: profile.avatar_url,
      });
      if (result.success) {
        toast.success('Profile updated');
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `avatar.${ext}`;

      const urlResult = await getAvatarUploadUrl(fileName);
      if (!urlResult.success) {
        toast.error(urlResult.error);
        return;
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(urlResult.data.path, file, { upsert: true });

      if (uploadError) {
        toast.error('Upload failed: ' + uploadError.message);
        return;
      }

      // Add cache-buster to URL
      const publicUrl = `${urlResult.data.publicUrl}?t=${Date.now()}`;
      setProfile({ ...profile, avatar_url: publicUrl });

      // Save to profile
      const saveResult = await updateProfile({ avatar_url: publicUrl });
      if (saveResult.success) {
        toast.success('Profile photo updated');
      } else {
        toast.error(saveResult.error);
      }
    } finally {
      setUploading(false);
    }
  }

  const initials = profile
    ? (profile.display_name || profile.email.split('@')[0]).slice(0, 2).toUpperCase()
    : '';

  if (loading) {
    return (
      <div>
        <PageHeader title="Profile" backHref="/settings" backLabel="Settings" />
        <div className="max-w-2xl space-y-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <PageHeader title="Profile" backHref="/settings" backLabel="Settings" />
        <p className="text-muted-foreground">Failed to load profile.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Profile" backHref="/settings" backLabel="Settings" />
      <div className="max-w-2xl space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.email} />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-medium">{profile.display_name || profile.email.split('@')[0]}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
          <Input
            id="display-name"
            value={profile.display_name || ''}
            onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            placeholder="Your name"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="flex gap-2">
            <Input id="email" value={profile.email} disabled className="flex-1" />
            <Button variant="outline" size="sm" asChild>
              <a href="/settings/security">Change email</a>
            </Button>
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            value={profile.timezone}
            onValueChange={(val) => setProfile({ ...profile, timezone: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={profile.location || ''}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            placeholder="e.g., New York, NY"
          />
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
