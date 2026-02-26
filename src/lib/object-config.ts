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
const documentStatuses = ['Draft', 'In Review', 'Published', 'Needs Update', 'Archived'];
const personStatuses = ['Active', 'Inactive'];
const roleStatuses = ['Active', 'Inactive', 'Open'];
const softwareStatuses = ['Active', 'Under Evaluation', 'Deprecated'];
const pricingModels = ['Per Seat', 'Flat Rate', 'Usage-Based', 'Tiered'];
const billingCycles = ['Monthly', 'Annual'];
const workArrangements = ['In-Person', 'Remote', 'Hybrid'];
const templateTypes = ['Form', 'Template', 'Contract', 'Report', 'Checklist Template'];

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
      { key: 'description', label: 'Description', type: 'markdown', visible: false, editable: true },
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
      { label: 'SOPs', junctionTable: 'sop_functions', targetType: 'sop', targetLabel: 'SOPs', targetLabelField: 'title' },
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
      { label: 'SOPs', junctionTable: 'sop_subfunctions', targetType: 'sop', targetLabel: 'SOPs', targetLabelField: 'title' },
      { label: 'Checklists', junctionTable: 'checklist_subfunctions', targetType: 'checklist', targetLabel: 'Checklists', targetLabelField: 'title' },
      { label: 'Templates', junctionTable: 'template_subfunctions', targetType: 'template', targetLabel: 'Templates', targetLabelField: 'title' },
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
      { key: 'trigger', label: 'Trigger', type: 'text', visible: false, editable: true },
      { key: 'end_state', label: 'End State', type: 'text', visible: false, editable: true },
      { key: 'estimated_duration', label: 'Est. Duration', type: 'text', visible: false, editable: true },
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
      { label: 'SOPs', junctionTable: 'sop_processes', targetType: 'sop', targetLabel: 'SOPs', targetLabelField: 'title' },
      { label: 'Checklists', junctionTable: 'checklist_processes', targetType: 'checklist', targetLabel: 'Checklists', targetLabelField: 'title' },
      { label: 'Templates', junctionTable: 'template_processes', targetType: 'template', targetLabel: 'Templates', targetLabelField: 'title' },
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
      { key: 'description', label: 'Description', type: 'text', visible: false, editable: true },
      { key: 'trigger', label: 'Trigger', type: 'text', visible: false, editable: true },
      { key: 'end_state', label: 'End State', type: 'text', visible: false, editable: true },
      { key: 'video_url', label: 'Video', type: 'url', visible: false, editable: true },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
    ],
    quickCreateFields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Must start with action verb (e.g., "Review invoice")' },
    ],
    associations: [
      { label: 'Processes', junctionTable: 'process_core_activities', targetType: 'process', targetLabel: 'Processes', targetLabelField: 'title' },
      { label: 'Roles', junctionTable: 'core_activity_roles', targetType: 'role', targetLabel: 'Roles', targetLabelField: 'title' },
      { label: 'People', junctionTable: 'core_activity_people', targetType: 'person', targetLabel: 'People', targetLabelField: 'first_name' },
      { label: 'Software', junctionTable: 'core_activity_software', targetType: 'software', targetLabel: 'Software', targetLabelField: 'title' },
      { label: 'SOPs', junctionTable: 'sop_core_activities', targetType: 'sop', targetLabel: 'SOPs', targetLabelField: 'title' },
      { label: 'Checklists', junctionTable: 'checklist_core_activities', targetType: 'checklist', targetLabel: 'Checklists', targetLabelField: 'title' },
      { label: 'Templates', junctionTable: 'template_core_activities', targetType: 'template', targetLabel: 'Templates', targetLabelField: 'title' },
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
      { key: 'location', label: 'Location', type: 'text', visible: false, editable: true },
      { key: 'salary', label: 'Salary', type: 'currency', visible: false, editable: true },
      { key: 'start_date', label: 'Start Date', type: 'date', visible: false, editable: true },
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
      { label: 'SOPs', junctionTable: 'sop_people', targetType: 'sop', targetLabel: 'SOPs', targetLabelField: 'title' },
      { label: 'Checklists', junctionTable: 'checklist_people', targetType: 'checklist', targetLabel: 'Checklists', targetLabelField: 'title' },
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
      { key: 'brief_description', label: 'Brief Description', type: 'text', visible: false, editable: true },
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
      { label: 'SOPs', junctionTable: 'sop_roles', targetType: 'sop', targetLabel: 'SOPs', targetLabelField: 'title' },
      { label: 'Checklists', junctionTable: 'checklist_roles', targetType: 'checklist', targetLabel: 'Checklists', targetLabelField: 'title' },
      { label: 'Templates', junctionTable: 'template_roles', targetType: 'template', targetLabel: 'Templates', targetLabelField: 'title' },
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
      { key: 'url', label: 'URL', type: 'url', editable: true },
      { key: 'monthly_cost', label: 'Monthly Cost', type: 'currency', sortable: true, editable: true },
      { key: 'annual_cost', label: 'Annual Cost', type: 'currency', sortable: true, visible: false, editable: true },
      { key: 'pricing_model', label: 'Pricing Model', type: 'select', filterable: true, editable: true, options: pricingModels },
      { key: 'number_of_seats', label: 'Seats', type: 'number', visible: false, editable: true },
      { key: 'billing_cycle', label: 'Billing Cycle', type: 'select', options: billingCycles, visible: false, editable: true },
      { key: 'renewal_date', label: 'Renewal Date', type: 'date', sortable: true, visible: false, editable: true },
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
      { label: 'SOPs', junctionTable: 'sop_software', targetType: 'sop', targetLabel: 'SOPs', targetLabelField: 'title' },
      { label: 'Checklists', junctionTable: 'checklist_software', targetType: 'checklist', targetLabel: 'Checklists', targetLabelField: 'title' },
      { label: 'Templates', junctionTable: 'template_software', targetType: 'template', targetLabel: 'Templates', targetLabelField: 'title' },
    ],
  },
  sop: {
    type: 'sop',
    label: 'SOP',
    labelPlural: 'SOPs',
    tableName: 'sops',
    listHref: '/sops',
    recordHref: (id) => `/sops/${id}`,
    titleField: 'title',
    statusField: 'status',
    statusOptions: documentStatuses,
    columns: [
      { key: 'title', label: 'Title', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true, editable: true, options: documentStatuses },
      { key: 'description', label: 'Description', type: 'text', visible: false, editable: true },
      { key: 'trigger', label: 'Trigger', type: 'text', visible: false, editable: true },
      { key: 'end_state', label: 'End State', type: 'text', visible: false, editable: true },
      { key: 'content', label: 'Content', type: 'markdown', visible: false, editable: true },
      { key: 'video_url', label: 'Video', type: 'url', visible: false, editable: true },
      { key: 'version', label: 'Version', type: 'number', sortable: true, editable: true },
      { key: 'last_reviewed', label: 'Last Reviewed', type: 'date', sortable: true, editable: true },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
      { key: 'created_at', label: 'Created', type: 'date', sortable: true, visible: false },
    ],
    quickCreateFields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'SOP title' },
    ],
    associations: [
      { label: 'Core Activities', junctionTable: 'sop_core_activities', targetType: 'core_activity', targetLabel: 'Core Activities', targetLabelField: 'title' },
      { label: 'Processes', junctionTable: 'sop_processes', targetType: 'process', targetLabel: 'Processes', targetLabelField: 'title' },
      { label: 'Subfunctions', junctionTable: 'sop_subfunctions', targetType: 'subfunction', targetLabel: 'Subfunctions', targetLabelField: 'title' },
      { label: 'Functions', junctionTable: 'sop_functions', targetType: 'function', targetLabel: 'Functions', targetLabelField: 'title' },
      { label: 'Roles (Audience)', junctionTable: 'sop_roles', targetType: 'role', targetLabel: 'Roles', targetLabelField: 'title' },
      { label: 'People (Audience)', junctionTable: 'sop_people', targetType: 'person', targetLabel: 'People', targetLabelField: 'first_name' },
      { label: 'Software', junctionTable: 'sop_software', targetType: 'software', targetLabel: 'Software', targetLabelField: 'title' },
      { label: 'Templates', junctionTable: 'template_sops', targetType: 'template', targetLabel: 'Templates', targetLabelField: 'title' },
    ],
  },
  checklist: {
    type: 'checklist',
    label: 'Checklist',
    labelPlural: 'Checklists',
    tableName: 'checklists',
    listHref: '/checklists',
    recordHref: (id) => `/checklists/${id}`,
    titleField: 'title',
    statusField: 'status',
    statusOptions: documentStatuses,
    columns: [
      { key: 'title', label: 'Title', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true, editable: true, options: documentStatuses },
      { key: 'description', label: 'Description', type: 'text', visible: false, editable: true },
      { key: 'trigger', label: 'Trigger', type: 'text', visible: false, editable: true },
      { key: 'end_state', label: 'End State', type: 'text', visible: false, editable: true },
      { key: 'content', label: 'Checklist Items', type: 'markdown', visible: false, editable: true },
      { key: 'version', label: 'Version', type: 'number', sortable: true, editable: true },
      { key: 'last_reviewed', label: 'Last Reviewed', type: 'date', sortable: true, editable: true },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
      { key: 'created_at', label: 'Created', type: 'date', sortable: true, visible: false },
    ],
    quickCreateFields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Checklist title' },
    ],
    associations: [
      { label: 'Core Activities', junctionTable: 'checklist_core_activities', targetType: 'core_activity', targetLabel: 'Core Activities', targetLabelField: 'title' },
      { label: 'Processes', junctionTable: 'checklist_processes', targetType: 'process', targetLabel: 'Processes', targetLabelField: 'title' },
      { label: 'Subfunctions', junctionTable: 'checklist_subfunctions', targetType: 'subfunction', targetLabel: 'Subfunctions', targetLabelField: 'title' },
      { label: 'Roles (Audience)', junctionTable: 'checklist_roles', targetType: 'role', targetLabel: 'Roles', targetLabelField: 'title' },
      { label: 'People (Audience)', junctionTable: 'checklist_people', targetType: 'person', targetLabel: 'People', targetLabelField: 'first_name' },
      { label: 'Software', junctionTable: 'checklist_software', targetType: 'software', targetLabel: 'Software', targetLabelField: 'title' },
      { label: 'Templates', junctionTable: 'template_checklists', targetType: 'template', targetLabel: 'Templates', targetLabelField: 'title' },
    ],
  },
  template: {
    type: 'template',
    label: 'Template',
    labelPlural: 'Templates',
    tableName: 'templates',
    listHref: '/templates',
    recordHref: (id) => `/templates/${id}`,
    titleField: 'title',
    statusField: 'status',
    statusOptions: documentStatuses,
    columns: [
      { key: 'title', label: 'Title', type: 'text', sortable: true, filterable: true, editable: true },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true, editable: true, options: documentStatuses },
      { key: 'type', label: 'Type', type: 'select', filterable: true, editable: true, options: templateTypes },
      { key: 'description', label: 'Description', type: 'text', visible: false, editable: true },
      { key: 'content', label: 'Template Content', type: 'markdown', visible: false, editable: true },
      { key: 'location_url', label: 'Location URL', type: 'url', editable: true },
      { key: 'responsible_role_id', label: 'Responsible Role', type: 'reference', editable: true, referenceType: 'role' },
      { key: 'responsible_person_id', label: 'Responsible Person', type: 'reference', editable: true, referenceType: 'person' },
      { key: 'version', label: 'Version', type: 'number', sortable: true, editable: true },
      { key: 'last_reviewed', label: 'Last Reviewed', type: 'date', sortable: true, editable: true },
      { key: 'updated_at', label: 'Last Modified', type: 'date', sortable: true },
      { key: 'created_at', label: 'Created', type: 'date', sortable: true, visible: false },
    ],
    quickCreateFields: [
      { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Template title' },
      { key: 'type', label: 'Type', type: 'select', options: templateTypes },
    ],
    associations: [
      { label: 'Core Activities', junctionTable: 'template_core_activities', targetType: 'core_activity', targetLabel: 'Core Activities', targetLabelField: 'title' },
      { label: 'Processes', junctionTable: 'template_processes', targetType: 'process', targetLabel: 'Processes', targetLabelField: 'title' },
      { label: 'Subfunctions', junctionTable: 'template_subfunctions', targetType: 'subfunction', targetLabel: 'Subfunctions', targetLabelField: 'title' },
      { label: 'Roles (Users)', junctionTable: 'template_roles', targetType: 'role', targetLabel: 'Roles', targetLabelField: 'title' },
      { label: 'Software', junctionTable: 'template_software', targetType: 'software', targetLabel: 'Software', targetLabelField: 'title' },
      { label: 'SOPs', junctionTable: 'template_sops', targetType: 'sop', targetLabel: 'SOPs', targetLabelField: 'title' },
      { label: 'Checklists', junctionTable: 'template_checklists', targetType: 'checklist', targetLabel: 'Checklists', targetLabelField: 'title' },
    ],
  },
};

export function getObjectConfig(type: string): ObjectConfig {
  const config = OBJECT_CONFIGS[type];
  if (!config) throw new Error(`Unknown object type: ${type}`);
  return config;
}

/** Document object types that use the Document View (Notion-style editor) */
export const DOCUMENT_TYPES: ObjectType[] = ['sop', 'checklist', 'template'];

export function isDocumentType(type: string): boolean {
  return DOCUMENT_TYPES.includes(type as ObjectType);
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
  Published: 'bg-green-100 text-green-700',
  'Needs Update': 'bg-orange-100 text-orange-700',
  Archived: 'bg-red-100 text-red-700',
  Inactive: 'bg-gray-100 text-gray-700',
  Open: 'bg-blue-100 text-blue-700',
  'Under Evaluation': 'bg-yellow-100 text-yellow-700',
  Deprecated: 'bg-red-100 text-red-700',
};
