-- =============================================================================
-- Ops Map — Phase 1 Foundation Migration
-- Creates all MVP tables, junction tables, supporting tables, RLS, and triggers
-- =============================================================================

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE operational_status AS ENUM ('Draft', 'In Review', 'Active', 'Needs Update', 'Archived');
CREATE TYPE person_status AS ENUM ('Active', 'Inactive');
CREATE TYPE role_status AS ENUM ('Active', 'Inactive', 'Open');
CREATE TYPE software_status AS ENUM ('Active', 'Under Evaluation', 'Deprecated');
CREATE TYPE pricing_model AS ENUM ('Per Seat', 'Flat Rate', 'Usage-Based', 'Tiered');
CREATE TYPE billing_cycle AS ENUM ('Monthly', 'Annual');
CREATE TYPE work_arrangement AS ENUM ('In-Person', 'Remote', 'Hybrid');
CREATE TYPE org_role AS ENUM ('admin', 'member');
CREATE TYPE object_type AS ENUM ('function', 'subfunction', 'process', 'core_activity', 'person', 'role', 'software');
CREATE TYPE property_type AS ENUM ('text', 'number', 'date', 'select', 'multi_select', 'url', 'email', 'phone', 'currency', 'boolean');
CREATE TYPE activity_action AS ENUM ('created', 'updated', 'status_changed', 'association_added', 'association_removed', 'comment');

-- =============================================================================
-- 1.4 SUPPORTING TABLES
-- =============================================================================

-- Organizations (multi-tenancy root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  revenue NUMERIC,
  location TEXT,
  key_objectives TEXT,
  company_description TEXT,
  biggest_pains TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User-organization junction (auth linkage)
CREATE TABLE user_organizations (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);
CREATE INDEX idx_user_organizations_org ON user_organizations(organization_id);
CREATE INDEX idx_user_organizations_user ON user_organizations(user_id);

-- =============================================================================
-- 1.2 CORE TABLES — 7 MVP Objects
-- =============================================================================

-- Functions
CREATE TABLE functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status operational_status NOT NULL DEFAULT 'Draft',
  owner_id UUID, -- FK to persons (added after persons table)
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_functions_org ON functions(organization_id);
CREATE INDEX idx_functions_status ON functions(organization_id, status);

-- Subfunctions
CREATE TABLE subfunctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status operational_status NOT NULL DEFAULT 'Draft',
  owner_id UUID, -- FK to persons (added later)
  function_id UUID NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subfunctions_org ON subfunctions(organization_id);
CREATE INDEX idx_subfunctions_function ON subfunctions(function_id);

-- Persons
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  description TEXT,
  status person_status NOT NULL DEFAULT 'Active',
  email TEXT,
  mobile_phone TEXT,
  work_phone TEXT,
  personal_phone TEXT,
  job_title TEXT,
  primary_role_id UUID,   -- FK added after roles table
  primary_function_id UUID REFERENCES functions(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  start_date DATE,
  salary NUMERIC,
  location TEXT,
  work_arrangement work_arrangement,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  profile_photo_url TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_persons_org ON persons(organization_id);
CREATE INDEX idx_persons_manager ON persons(manager_id);
CREATE INDEX idx_persons_primary_role ON persons(primary_role_id);
CREATE INDEX idx_persons_primary_function ON persons(primary_function_id);

-- Add FK from functions/subfunctions to persons now that persons exists
ALTER TABLE functions ADD CONSTRAINT fk_functions_owner FOREIGN KEY (owner_id) REFERENCES persons(id) ON DELETE SET NULL;
ALTER TABLE subfunctions ADD CONSTRAINT fk_subfunctions_owner FOREIGN KEY (owner_id) REFERENCES persons(id) ON DELETE SET NULL;

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status role_status NOT NULL DEFAULT 'Active',
  brief_description TEXT,
  job_description TEXT,
  primary_function_id UUID REFERENCES functions(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_roles_org ON roles(organization_id);
CREATE INDEX idx_roles_primary_function ON roles(primary_function_id);

-- Add FK from persons to roles now that roles exists
ALTER TABLE persons ADD CONSTRAINT fk_persons_primary_role FOREIGN KEY (primary_role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Processes
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status operational_status NOT NULL DEFAULT 'Draft',
  owner_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  owner_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  trigger TEXT,
  end_state TEXT,
  estimated_duration TEXT,
  last_revised DATE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_processes_org ON processes(organization_id);
CREATE INDEX idx_processes_owner_person ON processes(owner_person_id);
CREATE INDEX idx_processes_owner_role ON processes(owner_role_id);

-- Core Activities
CREATE TABLE core_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status operational_status NOT NULL DEFAULT 'Draft',
  trigger TEXT,
  end_state TEXT,
  video_url TEXT,
  subfunction_id UUID REFERENCES subfunctions(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_core_activities_org ON core_activities(organization_id);
CREATE INDEX idx_core_activities_subfunction ON core_activities(subfunction_id);
CREATE INDEX idx_core_activities_status ON core_activities(organization_id, status);

-- Software
CREATE TABLE software (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status software_status NOT NULL DEFAULT 'Active',
  category TEXT[],
  url TEXT,
  monthly_cost NUMERIC,
  annual_cost NUMERIC,
  pricing_model pricing_model,
  number_of_seats INTEGER,
  current_discount TEXT,
  renewal_date DATE,
  billing_cycle billing_cycle,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_software_org ON software(organization_id);

-- =============================================================================
-- 1.4 SUPPORTING TABLES (continued)
-- =============================================================================

-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_workflows_org ON workflows(organization_id);

-- Workflow Phases
CREATE TABLE workflow_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  status operational_status NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_workflow_phases_workflow ON workflow_phases(workflow_id);

-- Workflow Phase Processes
CREATE TABLE workflow_phase_processes (
  phase_id UUID NOT NULL REFERENCES workflow_phases(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (phase_id, process_id)
);

-- Handoff Blocks
CREATE TABLE handoff_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  from_phase_id UUID REFERENCES workflow_phases(id) ON DELETE SET NULL,
  to_phase_id UUID REFERENCES workflow_phases(id) ON DELETE SET NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_handoff_blocks_workflow ON handoff_blocks(workflow_id);

-- Custom Properties
CREATE TABLE custom_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  object_type object_type NOT NULL,
  property_name TEXT NOT NULL,
  property_type property_type NOT NULL,
  options JSONB,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_custom_properties_org_type ON custom_properties(organization_id, object_type);

-- Custom Property Values
CREATE TABLE custom_property_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_property_id UUID NOT NULL REFERENCES custom_properties(id) ON DELETE CASCADE,
  record_id UUID NOT NULL,
  record_type object_type NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_custom_property_values_record ON custom_property_values(record_id, record_type);
CREATE INDEX idx_custom_property_values_property ON custom_property_values(custom_property_id);

-- Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  record_id UUID NOT NULL,
  record_type object_type NOT NULL,
  action activity_action NOT NULL,
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  comment_text TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_log_record ON activity_log(record_id, record_type);
CREATE INDEX idx_activity_log_org ON activity_log(organization_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- =============================================================================
-- 1.3 JUNCTION TABLES
-- =============================================================================

-- Function associations
CREATE TABLE function_roles (
  function_id UUID NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (function_id, role_id)
);

CREATE TABLE function_people (
  function_id UUID NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (function_id, person_id)
);

CREATE TABLE function_software (
  function_id UUID NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (function_id, software_id)
);

CREATE TABLE function_workflows (
  function_id UUID NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (function_id, workflow_id)
);

-- Subfunction associations
CREATE TABLE subfunction_roles (
  subfunction_id UUID NOT NULL REFERENCES subfunctions(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (subfunction_id, role_id)
);

CREATE TABLE subfunction_people (
  subfunction_id UUID NOT NULL REFERENCES subfunctions(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (subfunction_id, person_id)
);

CREATE TABLE subfunction_software (
  subfunction_id UUID NOT NULL REFERENCES subfunctions(id) ON DELETE CASCADE,
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (subfunction_id, software_id)
);

CREATE TABLE subfunction_processes (
  subfunction_id UUID NOT NULL REFERENCES subfunctions(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (subfunction_id, process_id)
);

-- Process associations
CREATE TABLE process_core_activities (
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  core_activity_id UUID NOT NULL REFERENCES core_activities(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (process_id, core_activity_id)
);
CREATE INDEX idx_process_core_activities_pos ON process_core_activities(process_id, position);

CREATE TABLE process_subfunctions (
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  subfunction_id UUID NOT NULL REFERENCES subfunctions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (process_id, subfunction_id)
);

CREATE TABLE process_roles_involved (
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (process_id, role_id)
);

CREATE TABLE process_people_involved (
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (process_id, person_id)
);

CREATE TABLE process_software (
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (process_id, software_id)
);

-- Core Activity associations
CREATE TABLE core_activity_roles (
  core_activity_id UUID NOT NULL REFERENCES core_activities(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (core_activity_id, role_id)
);

CREATE TABLE core_activity_people (
  core_activity_id UUID NOT NULL REFERENCES core_activities(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (core_activity_id, person_id)
);

CREATE TABLE core_activity_software (
  core_activity_id UUID NOT NULL REFERENCES core_activities(id) ON DELETE CASCADE,
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (core_activity_id, software_id)
);

-- Role associations
CREATE TABLE role_people (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (role_id, person_id)
);

CREATE TABLE role_subfunctions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  subfunction_id UUID NOT NULL REFERENCES subfunctions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (role_id, subfunction_id)
);

-- Software associations
CREATE TABLE software_people (
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (software_id, person_id)
);

CREATE TABLE software_roles (
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (software_id, role_id)
);

-- =============================================================================
-- 1.6 TRIGGERS & FUNCTIONS
-- =============================================================================

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all object tables
CREATE TRIGGER trg_functions_updated_at BEFORE UPDATE ON functions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subfunctions_updated_at BEFORE UPDATE ON subfunctions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_processes_updated_at BEFORE UPDATE ON processes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_core_activities_updated_at BEFORE UPDATE ON core_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_persons_updated_at BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_software_updated_at BEFORE UPDATE ON software FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_workflow_phases_updated_at BEFORE UPDATE ON workflow_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_custom_property_values_updated_at BEFORE UPDATE ON custom_property_values FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 1.5 ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Helper function: get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM user_organizations WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subfunctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE software ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_phase_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_property_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE subfunction_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subfunction_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE subfunction_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE subfunction_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_core_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_subfunctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_roles_involved ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_people_involved ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_activity_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_activity_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_activity_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_subfunctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE software_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE software_roles ENABLE ROW LEVEL SECURITY;

-- Organizations: users can see their own orgs
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can update their organizations"
  ON organizations FOR UPDATE
  USING (id IN (SELECT get_user_org_ids()));

-- user_organizations: users can see their own memberships
CREATE POLICY "Users can view their org memberships"
  ON user_organizations FOR SELECT
  USING (user_id = auth.uid() OR organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Admins can manage org memberships"
  ON user_organizations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Macro: create standard RLS policies for org-scoped tables
-- We apply the same pattern to all 7 object tables + supporting tables

-- Functions
CREATE POLICY "org_isolation_select" ON functions FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON functions FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON functions FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON functions FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Subfunctions
CREATE POLICY "org_isolation_select" ON subfunctions FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON subfunctions FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON subfunctions FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON subfunctions FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Processes
CREATE POLICY "org_isolation_select" ON processes FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON processes FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON processes FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON processes FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Core Activities
CREATE POLICY "org_isolation_select" ON core_activities FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON core_activities FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON core_activities FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON core_activities FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Persons
CREATE POLICY "org_isolation_select" ON persons FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON persons FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON persons FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON persons FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Roles
CREATE POLICY "org_isolation_select" ON roles FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON roles FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON roles FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON roles FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Software
CREATE POLICY "org_isolation_select" ON software FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON software FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON software FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON software FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Workflows
CREATE POLICY "org_isolation_select" ON workflows FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON workflows FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON workflows FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON workflows FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Workflow Phases (via workflow's org)
CREATE POLICY "org_isolation_select" ON workflow_phases FOR SELECT
  USING (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_id AND w.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "org_isolation_insert" ON workflow_phases FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_id AND w.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "org_isolation_update" ON workflow_phases FOR UPDATE
  USING (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_id AND w.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "org_isolation_delete" ON workflow_phases FOR DELETE
  USING (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_id AND w.organization_id IN (SELECT get_user_org_ids())));

-- Workflow Phase Processes (via phase -> workflow's org)
CREATE POLICY "org_isolation_select" ON workflow_phase_processes FOR SELECT
  USING (EXISTS (SELECT 1 FROM workflow_phases wp JOIN workflows w ON w.id = wp.workflow_id WHERE wp.id = phase_id AND w.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "org_isolation_insert" ON workflow_phase_processes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM workflow_phases wp JOIN workflows w ON w.id = wp.workflow_id WHERE wp.id = phase_id AND w.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "org_isolation_delete" ON workflow_phase_processes FOR DELETE
  USING (EXISTS (SELECT 1 FROM workflow_phases wp JOIN workflows w ON w.id = wp.workflow_id WHERE wp.id = phase_id AND w.organization_id IN (SELECT get_user_org_ids())));

-- Handoff Blocks (via workflow's org)
CREATE POLICY "org_isolation_select" ON handoff_blocks FOR SELECT
  USING (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_id AND w.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "org_isolation_insert" ON handoff_blocks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_id AND w.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "org_isolation_delete" ON handoff_blocks FOR DELETE
  USING (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_id AND w.organization_id IN (SELECT get_user_org_ids())));

-- Custom Properties
CREATE POLICY "org_isolation_select" ON custom_properties FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON custom_properties FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON custom_properties FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON custom_properties FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- Custom Property Values (via custom_property's org)
CREATE POLICY "org_isolation_select" ON custom_property_values FOR SELECT
  USING (EXISTS (SELECT 1 FROM custom_properties cp WHERE cp.id = custom_property_id AND cp.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "org_isolation_insert" ON custom_property_values FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM custom_properties cp WHERE cp.id = custom_property_id AND cp.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "org_isolation_update" ON custom_property_values FOR UPDATE
  USING (EXISTS (SELECT 1 FROM custom_properties cp WHERE cp.id = custom_property_id AND cp.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "org_isolation_delete" ON custom_property_values FOR DELETE
  USING (EXISTS (SELECT 1 FROM custom_properties cp WHERE cp.id = custom_property_id AND cp.organization_id IN (SELECT get_user_org_ids())));

-- Activity Log
CREATE POLICY "org_isolation_select" ON activity_log FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON activity_log FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- Junction table RLS — each junction references a parent object with org_id
-- For junction tables we check via the parent table's org access

-- Helper: generic junction RLS via parent table lookup
-- Function junctions
CREATE POLICY "junction_select" ON function_roles FOR SELECT
  USING (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON function_roles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON function_roles FOR DELETE
  USING (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON function_people FOR SELECT
  USING (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON function_people FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON function_people FOR DELETE
  USING (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON function_software FOR SELECT
  USING (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON function_software FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON function_software FOR DELETE
  USING (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON function_workflows FOR SELECT
  USING (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON function_workflows FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON function_workflows FOR DELETE
  USING (EXISTS (SELECT 1 FROM functions f WHERE f.id = function_id AND f.organization_id IN (SELECT get_user_org_ids())));

-- Subfunction junctions
CREATE POLICY "junction_select" ON subfunction_roles FOR SELECT
  USING (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON subfunction_roles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON subfunction_roles FOR DELETE
  USING (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON subfunction_people FOR SELECT
  USING (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON subfunction_people FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON subfunction_people FOR DELETE
  USING (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON subfunction_software FOR SELECT
  USING (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON subfunction_software FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON subfunction_software FOR DELETE
  USING (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON subfunction_processes FOR SELECT
  USING (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON subfunction_processes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON subfunction_processes FOR DELETE
  USING (EXISTS (SELECT 1 FROM subfunctions sf WHERE sf.id = subfunction_id AND sf.organization_id IN (SELECT get_user_org_ids())));

-- Process junctions
CREATE POLICY "junction_select" ON process_core_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON process_core_activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON process_core_activities FOR DELETE
  USING (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON process_subfunctions FOR SELECT
  USING (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON process_subfunctions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON process_subfunctions FOR DELETE
  USING (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON process_roles_involved FOR SELECT
  USING (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON process_roles_involved FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON process_roles_involved FOR DELETE
  USING (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON process_people_involved FOR SELECT
  USING (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON process_people_involved FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON process_people_involved FOR DELETE
  USING (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON process_software FOR SELECT
  USING (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON process_software FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON process_software FOR DELETE
  USING (EXISTS (SELECT 1 FROM processes p WHERE p.id = process_id AND p.organization_id IN (SELECT get_user_org_ids())));

-- Core Activity junctions
CREATE POLICY "junction_select" ON core_activity_roles FOR SELECT
  USING (EXISTS (SELECT 1 FROM core_activities ca WHERE ca.id = core_activity_id AND ca.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON core_activity_roles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM core_activities ca WHERE ca.id = core_activity_id AND ca.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON core_activity_roles FOR DELETE
  USING (EXISTS (SELECT 1 FROM core_activities ca WHERE ca.id = core_activity_id AND ca.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON core_activity_people FOR SELECT
  USING (EXISTS (SELECT 1 FROM core_activities ca WHERE ca.id = core_activity_id AND ca.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON core_activity_people FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM core_activities ca WHERE ca.id = core_activity_id AND ca.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON core_activity_people FOR DELETE
  USING (EXISTS (SELECT 1 FROM core_activities ca WHERE ca.id = core_activity_id AND ca.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON core_activity_software FOR SELECT
  USING (EXISTS (SELECT 1 FROM core_activities ca WHERE ca.id = core_activity_id AND ca.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON core_activity_software FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM core_activities ca WHERE ca.id = core_activity_id AND ca.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON core_activity_software FOR DELETE
  USING (EXISTS (SELECT 1 FROM core_activities ca WHERE ca.id = core_activity_id AND ca.organization_id IN (SELECT get_user_org_ids())));

-- Role junctions
CREATE POLICY "junction_select" ON role_people FOR SELECT
  USING (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_id AND r.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON role_people FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_id AND r.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON role_people FOR DELETE
  USING (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_id AND r.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON role_subfunctions FOR SELECT
  USING (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_id AND r.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON role_subfunctions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_id AND r.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON role_subfunctions FOR DELETE
  USING (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_id AND r.organization_id IN (SELECT get_user_org_ids())));

-- Software junctions
CREATE POLICY "junction_select" ON software_people FOR SELECT
  USING (EXISTS (SELECT 1 FROM software s WHERE s.id = software_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON software_people FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM software s WHERE s.id = software_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON software_people FOR DELETE
  USING (EXISTS (SELECT 1 FROM software s WHERE s.id = software_id AND s.organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "junction_select" ON software_roles FOR SELECT
  USING (EXISTS (SELECT 1 FROM software s WHERE s.id = software_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON software_roles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM software s WHERE s.id = software_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON software_roles FOR DELETE
  USING (EXISTS (SELECT 1 FROM software s WHERE s.id = software_id AND s.organization_id IN (SELECT get_user_org_ids())));

-- =============================================================================
-- Allow insert on organizations and user_organizations during signup
-- (service role handles signup, but we also need a policy for the initial insert)
-- =============================================================================

CREATE POLICY "Users can create organizations during signup"
  ON organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can create their own org membership"
  ON user_organizations FOR INSERT
  WITH CHECK (user_id = auth.uid());
