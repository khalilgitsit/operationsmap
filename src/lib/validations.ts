import { z } from 'zod';

// Shared enums
const operationalStatus = z.enum(['Draft', 'In Review', 'Active', 'Needs Update', 'Archived']);
const personStatus = z.enum(['Active', 'Inactive']);
const roleStatus = z.enum(['Active', 'Inactive', 'Open']);
const softwareStatus = z.enum(['Active', 'Under Evaluation', 'Deprecated']);
const pricingModel = z.enum(['Per Seat', 'Flat Rate', 'Usage-Based', 'Tiered']);
const billingCycle = z.enum(['Monthly', 'Annual']);
const workArrangement = z.enum(['In-Person', 'Remote', 'Hybrid']);

// Function schemas
export const createFunctionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: operationalStatus.optional().default('Draft'),
  owner_id: z.string().uuid().nullable().optional(),
});
export const updateFunctionSchema = createFunctionSchema.partial();

// Subfunction schemas
export const createSubfunctionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: operationalStatus.optional().default('Draft'),
  owner_id: z.string().uuid().nullable().optional(),
  function_id: z.string().uuid('Function is required'),
});
export const updateSubfunctionSchema = createSubfunctionSchema.partial();

// Process schemas
export const createProcessSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: operationalStatus.optional().default('Draft'),
  owner_person_id: z.string().uuid().nullable().optional(),
  owner_role_id: z.string().uuid().nullable().optional(),
  trigger: z.string().nullable().optional(),
  end_state: z.string().nullable().optional(),
  estimated_duration: z.string().nullable().optional(),
  last_revised: z.string().nullable().optional(),
});
export const updateProcessSchema = createProcessSchema.partial();

// Core Activity schemas
export const createCoreActivitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: operationalStatus.optional().default('Draft'),
  trigger: z.string().nullable().optional(),
  end_state: z.string().nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  subfunction_id: z.string().uuid().nullable().optional(),
});
export const updateCoreActivitySchema = createCoreActivitySchema.partial();

// Person schemas
export const createPersonSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  description: z.string().nullable().optional(),
  status: personStatus.optional().default('Active'),
  email: z.string().email().nullable().optional(),
  mobile_phone: z.string().nullable().optional(),
  work_phone: z.string().nullable().optional(),
  personal_phone: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),
  primary_role_id: z.string().uuid().nullable().optional(),
  primary_function_id: z.string().uuid().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  start_date: z.string().nullable().optional(),
  salary: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
  work_arrangement: workArrangement.nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  emergency_contact_relationship: z.string().nullable().optional(),
  profile_photo_url: z.string().url().nullable().optional(),
});
export const updatePersonSchema = createPersonSchema.partial();

// Role schemas
export const createRoleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: roleStatus.optional().default('Active'),
  brief_description: z.string().nullable().optional(),
  job_description: z.string().nullable().optional(),
  primary_function_id: z.string().uuid().nullable().optional(),
});
export const updateRoleSchema = createRoleSchema.partial();

// Software schemas
export const createSoftwareSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: softwareStatus.optional().default('Active'),
  category: z.array(z.string()).nullable().optional(),
  url: z.string().url().nullable().optional(),
  monthly_cost: z.number().nullable().optional(),
  annual_cost: z.number().nullable().optional(),
  pricing_model: pricingModel.nullable().optional(),
  number_of_seats: z.number().int().nullable().optional(),
  current_discount: z.string().nullable().optional(),
  renewal_date: z.string().nullable().optional(),
  billing_cycle: billingCycle.nullable().optional(),
});
export const updateSoftwareSchema = createSoftwareSchema.partial();

// Pagination schema
export const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

// Association schema
export const associationSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
});
