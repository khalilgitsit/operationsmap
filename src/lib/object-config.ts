import type { Database } from '@/types/database';

export type ObjectType = Database['public']['Enums']['object_type'];

export type FieldType =
  | 'text'
  | 'markdown'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'multi_select'
  | 'email'
  | 'phone'
  | 'url'
  | 'image'
  | 'reference'
  | 'boolean'
  | 'computed';

export interface ColumnConfig {
  key: string;
  label: string;
  type: FieldType;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  visible?: boolean;
  /** For select/multi_select fields */
  options?: string[];
  /** For reference fields */
  referenceType?: ObjectType;
  /** For computed fields */
  computeFn?: string;
  /** Width hint */
  width?: string;
}

export interface AssociationConfig {
  label: string;
  junctionTable: string;
  targetType: ObjectType;
  targetLabel: string;
  targetLabelField: string;
  ordered?: boolean;
}

export interface QuickCreateField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  referenceType?: ObjectType;
  tooltip?: string;
}

export interface ObjectConfig {
  type: ObjectType;
  label: string;
  labelPlural: string;
  tableName: string;
  listHref: string;
  recordHref: (id: string) => string;
  titleField: string;
  /** For Person we combine first_name + last_name */
  titleFields?: string[];
  columns: ColumnConfig[];
  quickCreateFields: QuickCreateField[];
  associations: AssociationConfig[];
  statusField: string;
  statusOptions: string[];
}

const operationalStatuses = ['Draft', 'In Review', 'Active', 'Needs Update', 'Archived'];
const personStatuses = ['Active', 'Inactive'];
const roleStatuses = ['Active', 'Inactive', 'Open'];
const softwareStatuses = ['Active', 'Under Evaluation', 'Deprecated'];
const pricingModels = ['Per Seat', 'Flat Rate', 'Usage-Based', 'Tiered'];
const billingCycles = ['Monthly', 'Annual'];
const workArrangements = ['In-Person', 'Remote', 'Hybrid'];

export const OBJECT_CONFIGS: Record<string, ObjectConfig> = {
  function: {
    type: 'function',
    label: 'Function',
    labelPlural: 'Functions',
    tableName: 'functions',
    listHref: '/functions',
    recordHref: (id) => `/functions/${id}`,
    titleField: 'title',
    statusField: 'status',
    statusOptions: operationalStatuses,
    columns: [
      { key: 'title', label: 'Title', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true, editable: true, options: operationalStatuses },
      { key: 'owner_id', label: 'Owner', type: 'reference', filterable: true, editable: true, referenceType: 'person' },
      { key: 'description', label: 'Description', type: 'markdown', visible: false },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
      { key: 'created_at', label: 'Created', type: 'date', sortable: true, visible: false },
    ],
    quickCreateFields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Function name' },
    ],
    associations: [
      { label: 'Subfunctions', junctionTable: '_children', targetType: 'subfunction', targetLabel: 'Subfunctions', targetLabelField: 'title' },
      { label: 'Roles', junctionTable: 'function_roles', targetType: 'role', targetLabel: 'Roles', targetLabelField: 'title' },
      { label: 'People', junctionTable: 'function_people', targetType: 'person', targetLabel: 'People', targetLabelField: 'first_name' },
      { label: 'Software', junctionTable: 'function_software', targetType: 'software', targetLabel: 'Software', targetLabelField: 'title' },
    ],
  },
  subfunction: {
    type: 'subfunction',
    label: 'Subfunction',
    labelPlural: 'Subfunctions',
    tableName: 'subfunctions',
    listHref: '/subfunctions',
    recordHref: (id) => `/subfunctions/${id}`,
    titleField: 'title',
    statusField: 'status',
    statusOptions: operationalStatuses,
    columns: [
      { key: 'title', label: 'Title', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'function_id', label: 'Function', type: 'reference', filterable: true, editable: true, referenceType: 'function' },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true, editable: true, options: operationalStatuses },
      { key: 'owner_id', label: 'Owner', type: 'reference', filterable: true, editable: true, referenceType: 'person' },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
    ],
    quickCreateFields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Subfunction name' },
      { key: 'function_id', label: 'Parent Function', type: 'reference', required: true, referenceType: 'function' },
    ],
    associations: [
      { label: 'Core Activities', junctionTable: '_children', targetType: 'core_activity', targetLabel: 'Core Activities', targetLabelField: 'title' },
      { label: 'Roles', junctionTable: 'subfunction_roles', targetType: 'role', targetLabel: 'Roles', targetLabelField: 'title' },
      { label: 'People', junctionTable: 'subfunction_people', targetType: 'person', targetLabel: 'People', targetLabelField: 'first_name' },
      { label: 'Software', junctionTable: 'subfunction_software', targetType: 'software', targetLabel: 'Software', targetLabelField: 'title' },
      { label: 'Processes', junctionTable: 'subfunction_processes', targetType: 'process', targetLabel: 'Processes', targetLabelField: 'title' },
    ],
  },
  process: {
    type: 'process',
    label: 'Process',
    labelPlural: 'Processes',
    tableName: 'processes',
    listHref: '/processes',
    recordHref: (id) => `/processes/${id}`,
    titleField: 'title',
    statusField: 'status',
    statusOptions: operationalStatuses,
    columns: [
      { key: 'title', label: 'Title', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true, editable: true, options: operationalStatuses },
      { key: 'owner_person_id', label: 'Owner (Person)', type: 'reference', filterable: true, editable: true, referenceType: 'person' },
      { key: 'owner_role_id', label: 'Owner (Role)', type: 'reference', filterable: true, editable: true, referenceType: 'role' },
      { key: 'trigger', label: 'Trigger', type: 'text', visible: false },
      { key: 'end_state', label: 'End State', type: 'text', visible: false },
      { key: 'estimated_duration', label: 'Est. Duration', type: 'text', visible: false },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
    ],
    quickCreateFields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Process name' },
      { key: 'trigger', label: 'Trigger', type: 'text', placeholder: 'What starts this process?' },
      { key: 'end_state', label: 'End State', type: 'text', placeholder: 'What is the outcome?' },
    ],
    associations: [
      { label: 'Core Activities', junctionTable: 'process_core_activities', targetType: 'core_activity', targetLabel: 'Core Activities', targetLabelField: 'title', ordered: true },
      { label: 'Subfunctions', junctionTable: 'process_subfunctions', targetType: 'subfunction', targetLabel: 'Subfunctions', targetLabelField: 'title' },
      { label: 'Roles (Involved)', junctionTable: 'process_roles_involved', targetType: 'role', targetLabel: 'Roles', targetLabelField: 'title' },
      { label: 'People (Involved)', junctionTable: 'process_people_involved', targetType: 'person', targetLabel: 'People', targetLabelField: 'first_name' },
      { label: 'Software', junctionTable: 'process_software', targetType: 'software', targetLabel: 'Software', targetLabelField: 'title' },
    ],
  },
  core_activity: {
    type: 'core_activity',
    label: 'Core Activity',
    labelPlural: 'Core Activities',
    tableName: 'core_activities',
    listHref: '/core-activities',
    recordHref: (id) => `/core-activities/${id}`,
    titleField: 'title',
    statusField: 'status',
    statusOptions: operationalStatuses,
    columns: [
      { key: 'title', label: 'Title', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true, editable: true, options: operationalStatuses },
      { key: 'subfunction_id', label: 'Subfunction', type: 'reference', filterable: true, editable: true, referenceType: 'subfunction' },
      { key: 'trigger', label: 'Trigger', type: 'text', visible: false },
      { key: 'end_state', label: 'End State', type: 'text', visible: false },
      { key: 'video_url', label: 'Video', type: 'url', visible: false },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
    ],
    quickCreateFields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Must start with action verb (e.g., "Review invoice")' },
    ],
    associations: [
      { label: 'Roles', junctionTable: 'core_activity_roles', targetType: 'role', targetLabel: 'Roles', targetLabelField: 'title' },
      { label: 'People', junctionTable: 'core_activity_people', targetType: 'person', targetLabel: 'People', targetLabelField: 'first_name' },
      { label: 'Software', junctionTable: 'core_activity_software', targetType: 'software', targetLabel: 'Software', targetLabelField: 'title' },
    ],
  },
  person: {
    type: 'person',
    label: 'Person',
    labelPlural: 'People',
    tableName: 'persons',
    listHref: '/people',
    recordHref: (id) => `/people/${id}`,
    titleField: 'first_name',
    titleFields: ['first_name', 'last_name'],
    statusField: 'status',
    statusOptions: personStatuses,
    columns: [
      { key: 'first_name', label: 'First Name', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'last_name', label: 'Last Name', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'email', label: 'Email', type: 'email', filterable: true, editable: true },
      { key: 'job_title', label: 'Job Title', type: 'text', filterable: true, editable: true },
      { key: 'primary_role_id', label: 'Primary Role', type: 'reference', filterable: true, editable: true, referenceType: 'role' },
      { key: 'primary_function_id', label: 'Primary Function', type: 'reference', filterable: true, editable: true, referenceType: 'function' },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true, editable: true, options: personStatuses },
      { key: 'work_arrangement', label: 'Work Arrangement', type: 'select', filterable: true, editable: true, options: workArrangements },
      { key: 'location', label: 'Location', type: 'text', visible: false },
      { key: 'salary', label: 'Salary', type: 'currency', visible: false },
      { key: 'start_date', label: 'Start Date', type: 'date', visible: false },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
    ],
    quickCreateFields: [
      { key: 'first_name', label: 'First Name', type: 'text', required: true, placeholder: 'First name' },
      { key: 'last_name', label: 'Last Name', type: 'text', required: true, placeholder: 'Last name' },
      { key: 'job_title', label: 'Job Title', type: 'text', placeholder: 'Job title' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'email@company.com' },
      { key: 'primary_role_id', label: 'Primary Role', type: 'reference', referenceType: 'role' },
      { key: 'primary_function_id', label: 'Primary Function', type: 'reference', referenceType: 'function', tooltip: 'Functions should be set intentionally. Manage them in the Function Chart.' },
    ],
    associations: [
      { label: 'Roles', junctionTable: 'role_people', targetType: 'role', targetLabel: 'Roles', targetLabelField: 'title' },
      { label: 'Core Activities', junctionTable: 'core_activity_people', targetType: 'core_activity', targetLabel: 'Core Activities', targetLabelField: 'title' },
      { label: 'Software', junctionTable: 'software_people', targetType: 'software', targetLabel: 'Software', targetLabelField: 'title' },
    ],
  },
  role: {
    type: 'role',
    label: 'Role',
    labelPlural: 'Roles',
    tableName: 'roles',
    listHref: '/roles',
    recordHref: (id) => `/roles/${id}`,
    titleField: 'title',
    statusField: 'status',
    statusOptions: roleStatuses,
    columns: [
      { key: 'title', label: 'Title', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true, editable: true, options: roleStatuses },
      { key: 'primary_function_id', label: 'Primary Function', type: 'reference', filterable: true, editable: true, referenceType: 'function' },
      { key: 'brief_description', label: 'Brief Description', type: 'text', visible: false },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
    ],
    quickCreateFields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Role title' },
      { key: 'primary_function_id', label: 'Primary Function', type: 'reference', referenceType: 'function' },
    ],
    associations: [
      { label: 'People', junctionTable: 'role_people', targetType: 'person', targetLabel: 'People', targetLabelField: 'first_name' },
      { label: 'Subfunctions', junctionTable: 'role_subfunctions', targetType: 'subfunction', targetLabel: 'Subfunctions', targetLabelField: 'title' },
      { label: 'Core Activities', junctionTable: 'core_activity_roles', targetType: 'core_activity', targetLabel: 'Core Activities', targetLabelField: 'title' },
    ],
  },
  software: {
    type: 'software',
    label: 'Software',
    labelPlural: 'Software',
    tableName: 'software',
    listHref: '/software',
    recordHref: (id) => `/software/${id}`,
    titleField: 'title',
    statusField: 'status',
    statusOptions: softwareStatuses,
    columns: [
      { key: 'title', label: 'Title', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true, editable: true, options: softwareStatuses },
      { key: 'category', label: 'Category', type: 'multi_select', filterable: true, editable: true },
      { key: 'url', label: 'URL', type: 'url' },
      { key: 'monthly_cost', label: 'Monthly Cost', type: 'currency', sortable: true },
      { key: 'annual_cost', label: 'Annual Cost', type: 'currency', sortable: true, visible: false },
      { key: 'pricing_model', label: 'Pricing Model', type: 'select', filterable: true, editable: true, options: pricingModels },
      { key: 'number_of_seats', label: 'Seats', type: 'number', visible: false },
      { key: 'billing_cycle', label: 'Billing Cycle', type: 'select', options: billingCycles, visible: false },
      { key: 'renewal_date', label: 'Renewal Date', type: 'date', sortable: true, visible: false },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
    ],
    quickCreateFields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Software name' },
      { key: 'category', label: 'Category', type: 'multi_select' },
    ],
    associations: [
      { label: 'People', junctionTable: 'software_people', targetType: 'person', targetLabel: 'People', targetLabelField: 'first_name' },
      { label: 'Roles', junctionTable: 'software_roles', targetType: 'role', targetLabel: 'Roles', targetLabelField: 'title' },
      { label: 'Core Activities', junctionTable: 'core_activity_software', targetType: 'core_activity', targetLabel: 'Core Activities', targetLabelField: 'title' },
    ],
  },
};

export function getObjectConfig(type: string): ObjectConfig {
  const config = OBJECT_CONFIGS[type];
  if (!config) throw new Error(`Unknown object type: ${type}`);
  return config;
}

export function getRecordTitle(record: Record<string, unknown>, config: ObjectConfig): string {
  if (config.titleFields) {
    return config.titleFields.map((f) => record[f] || '').join(' ').trim();
  }
  return (record[config.titleField] as string) || 'Untitled';
}

export const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  'In Review': 'bg-yellow-100 text-yellow-700',
  Active: 'bg-green-100 text-green-700',
  'Needs Update': 'bg-orange-100 text-orange-700',
  Archived: 'bg-red-100 text-red-700',
  Inactive: 'bg-gray-100 text-gray-700',
  Open: 'bg-blue-100 text-blue-700',
  'Under Evaluation': 'bg-yellow-100 text-yellow-700',
  Deprecated: 'bg-red-100 text-red-700',
};
