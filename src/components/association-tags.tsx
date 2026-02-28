import { Monitor, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Person Avatars ---

interface PersonAvatarsProps {
  people: { id: string; first_name: string; last_name: string }[];
  size?: 'sm' | 'default';
  maxItems?: number;
  className?: string;
}

const personSizeClasses = {
  sm: { avatar: 'h-5 w-5 text-[9px]', overflow: 'text-[9px]' },
  default: { avatar: 'h-6 w-6 text-[10px]', overflow: 'text-[10px]' },
} as const;

export function PersonAvatars({ people, size = 'default', maxItems = 5, className }: PersonAvatarsProps) {
  if (people.length === 0) return null;
  const cls = personSizeClasses[size];
  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {people.slice(0, maxItems).map((p) => (
        <span
          key={p.id}
          className={`inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium ${cls.avatar}`}
          title={`${p.first_name} ${p.last_name}`}
        >
          {p.first_name[0]}{p.last_name[0]}
        </span>
      ))}
      {people.length > maxItems && (
        <span className={`text-muted-foreground ${cls.overflow}`}>
          +{people.length - maxItems}
        </span>
      )}
    </div>
  );
}

// --- Software Tags ---

interface SoftwareTagsProps {
  software: { id: string; title: string }[];
  size?: 'sm' | 'default';
  className?: string;
}

const softwareSizeClasses = {
  sm: { tag: 'text-[9px] px-1 py-0.5', icon: 'h-2.5 w-2.5', truncate: 10, gap: 'gap-0.5' },
  default: { tag: 'text-[10px] px-1.5 py-0.5', icon: 'h-3 w-3', truncate: 12, gap: 'gap-1' },
} as const;

export function SoftwareTags({ software, size = 'default', className }: SoftwareTagsProps) {
  if (software.length === 0) return null;
  const cls = softwareSizeClasses[size];
  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {software.map((s) => (
        <span
          key={s.id}
          className={`inline-flex items-center ${cls.gap} bg-[#d6e5f5] text-[#0b2d5d] rounded ${cls.tag}`}
          title={s.title}
        >
          <Monitor className={cls.icon} />
          {s.title.length > cls.truncate ? s.title.slice(0, cls.truncate) + '...' : s.title}
        </span>
      ))}
    </div>
  );
}

// --- Role Tags ---

interface RoleTagsProps {
  roles: { id: string; title: string }[];
  size?: 'sm' | 'default';
  className?: string;
}

const roleSizeClasses = {
  sm: { tag: 'text-[9px] px-1 py-0.5', icon: 'h-2.5 w-2.5', truncate: 12, gap: 'gap-0.5' },
  default: { tag: 'text-[10px] px-1.5 py-0.5', icon: 'h-3 w-3', truncate: 15, gap: 'gap-1' },
} as const;

export function RoleTags({ roles, size = 'default', className }: RoleTagsProps) {
  if (roles.length === 0) return null;
  const cls = roleSizeClasses[size];
  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {roles.map((r) => (
        <span
          key={r.id}
          className={`inline-flex items-center ${cls.gap} bg-[#e8dff5] text-[#4a2d82] rounded ${cls.tag}`}
        >
          <Shield className={cls.icon} />
          {r.title.length > cls.truncate ? r.title.slice(0, cls.truncate) + '...' : r.title}
        </span>
      ))}
    </div>
  );
}
