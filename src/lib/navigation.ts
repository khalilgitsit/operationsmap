import {
  LayoutDashboard,
  GitBranch,
  ListChecks,
  Grid3X3,
  FolderTree,
  Layers,
  Atom,
  Users,
  UserCog,
  Monitor,
  FileText,
  BookOpen,
  FileType,
  ClipboardList,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Home',
    icon: LayoutDashboard,
    items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Workflows',
    icon: GitBranch,
    items: [
      { label: 'All Workflows', href: '/workflows', icon: GitBranch },
      { label: 'Processes', href: '/processes', icon: ListChecks },
    ],
  },
  {
    label: 'Functions',
    icon: Grid3X3,
    items: [
      { label: 'Function Chart', href: '/function-chart', icon: Grid3X3 },
      { label: 'Functions', href: '/functions', icon: FolderTree },
      { label: 'Subfunctions', href: '/subfunctions', icon: Layers },
    ],
  },
  {
    label: 'Core Activities',
    icon: Atom,
    items: [{ label: 'Core Activities', href: '/core-activities', icon: Atom }],
  },
  {
    label: 'People',
    icon: Users,
    items: [
      { label: 'People', href: '/people', icon: Users },
      { label: 'Roles', href: '/roles', icon: UserCog },
    ],
  },
  {
    label: 'Resources',
    icon: Monitor,
    items: [{ label: 'Software', href: '/software', icon: Monitor }],
  },
  {
    label: 'Documents',
    icon: FileText,
    items: [
      { label: 'SOPs', href: '/sops', icon: BookOpen },
      { label: 'Checklists', href: '/checklists', icon: ClipboardList },
      { label: 'Templates', href: '/templates', icon: FileType },
    ],
  },
  {
    label: 'Tools',
    icon: Wrench,
    items: [{ label: 'Tools', href: '/tools', icon: Wrench }],
  },
];

// Object types for the "Create New" dropdown
export const OBJECT_TYPES = [
  { label: 'Function', href: '/functions', type: 'function' as const },
  { label: 'Subfunction', href: '/subfunctions', type: 'subfunction' as const },
  { label: 'Process', href: '/processes', type: 'process' as const },
  { label: 'Core Activity', href: '/core-activities', type: 'core_activity' as const },
  { label: 'Person', href: '/people', type: 'person' as const },
  { label: 'Role', href: '/roles', type: 'role' as const },
  { label: 'Software', href: '/software', type: 'software' as const },
  { label: 'SOP', href: '/sops', type: 'sop' as const },
  { label: 'Checklist', href: '/checklists', type: 'checklist' as const },
  { label: 'Template', href: '/templates', type: 'template' as const },
] as const;
