-- =============================================================================
-- Post-MVP Phase 2.2 — New Objects: SOP, Checklist, Template
-- Creates document tables, junction tables, RLS policies, indexes, triggers
-- =============================================================================

-- =============================================================================
-- ENUM UPDATES
-- =============================================================================

-- Add new object types to enum
ALTER TYPE object_type ADD VALUE IF NOT EXISTS 'sop';
ALTER TYPE object_type ADD VALUE IF NOT EXISTS 'checklist';
ALTER TYPE object_type ADD VALUE IF NOT EXISTS 'template';

-- Document lifecycle status: Draft → In Review → Published → Needs Update → Archived
CREATE TYPE document_status AS ENUM ('Draft', 'In Review', 'Published', 'Needs Update', 'Archived');

-- =============================================================================
-- SOP TABLE
-- =============================================================================

CREATE TABLE sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  trigger TEXT,
  end_state TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  last_reviewed TIMESTAMPTZ,
  status document_status NOT NULL DEFAULT 'Draft',
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sops_org ON sops(organization_id);
CREATE INDEX idx_sops_status ON sops(organization_id, status);
CREATE INDEX idx_sops_title ON sops(organization_id, title);

-- =============================================================================
-- CHECKLIST TABLE
-- =============================================================================

CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  last_reviewed TIMESTAMPTZ,
  status document_status NOT NULL DEFAULT 'Draft',
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklists_org ON checklists(organization_id);
CREATE INDEX idx_checklists_status ON checklists(organization_id, status);
CREATE INDEX idx_checklists_title ON checklists(organization_id, title);

-- =============================================================================
-- TEMPLATE TABLE
-- =============================================================================

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT,
  location_url TEXT,
  responsible_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  responsible_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  last_reviewed TIMESTAMPTZ,
  status document_status NOT NULL DEFAULT 'Draft',
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_templates_org ON templates(organization_id);
CREATE INDEX idx_templates_status ON templates(organization_id, status);
CREATE INDEX idx_templates_title ON templates(organization_id, title);
CREATE INDEX idx_templates_type ON templates(organization_id, type);

-- =============================================================================
-- JUNCTION TABLES — SOP ASSOCIATIONS
-- =============================================================================

-- SOP ↔ Core Activity
CREATE TABLE sop_core_activities (
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  core_activity_id UUID NOT NULL REFERENCES core_activities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (sop_id, core_activity_id)
);

-- SOP ↔ Process
CREATE TABLE sop_processes (
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (sop_id, process_id)
);

-- SOP ↔ Subfunction
CREATE TABLE sop_subfunctions (
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  subfunction_id UUID NOT NULL REFERENCES subfunctions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (sop_id, subfunction_id)
);

-- SOP ↔ Function
CREATE TABLE sop_functions (
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  function_id UUID NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (sop_id, function_id)
);

-- SOP ↔ Role (Audience)
CREATE TABLE sop_roles (
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (sop_id, role_id)
);

-- SOP ↔ Person (Audience)
CREATE TABLE sop_people (
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (sop_id, person_id)
);

-- SOP ↔ Software (Referenced)
CREATE TABLE sop_software (
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (sop_id, software_id)
);

-- =============================================================================
-- JUNCTION TABLES — CHECKLIST ASSOCIATIONS
-- =============================================================================

-- Checklist ↔ Core Activity
CREATE TABLE checklist_core_activities (
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  core_activity_id UUID NOT NULL REFERENCES core_activities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (checklist_id, core_activity_id)
);

-- Checklist ↔ Process
CREATE TABLE checklist_processes (
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (checklist_id, process_id)
);

-- Checklist ↔ Subfunction
CREATE TABLE checklist_subfunctions (
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  subfunction_id UUID NOT NULL REFERENCES subfunctions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (checklist_id, subfunction_id)
);

-- Checklist ↔ Role (Audience)
CREATE TABLE checklist_roles (
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (checklist_id, role_id)
);

-- Checklist ↔ Person (Audience)
CREATE TABLE checklist_people (
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (checklist_id, person_id)
);

-- Checklist ↔ Software (Referenced)
CREATE TABLE checklist_software (
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (checklist_id, software_id)
);

-- =============================================================================
-- JUNCTION TABLES — TEMPLATE ASSOCIATIONS
-- =============================================================================

-- Template ↔ Core Activity
CREATE TABLE template_core_activities (
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  core_activity_id UUID NOT NULL REFERENCES core_activities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (template_id, core_activity_id)
);

-- Template ↔ Process
CREATE TABLE template_processes (
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (template_id, process_id)
);

-- Template ↔ Subfunction
CREATE TABLE template_subfunctions (
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  subfunction_id UUID NOT NULL REFERENCES subfunctions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (template_id, subfunction_id)
);

-- Template ↔ Role (Users)
CREATE TABLE template_roles (
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (template_id, role_id)
);

-- Template ↔ Software (Hosted in)
CREATE TABLE template_software (
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  software_id UUID NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (template_id, software_id)
);

-- Template ↔ SOP (Referenced by)
CREATE TABLE template_sops (
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (template_id, sop_id)
);

-- Template ↔ Checklist (Referenced by)
CREATE TABLE template_checklists (
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (template_id, checklist_id)
);

-- =============================================================================
-- TRIGGERS — updated_at
-- =============================================================================

CREATE TRIGGER trg_sops_updated_at BEFORE UPDATE ON sops FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_checklists_updated_at BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- RLS — Main Tables
-- =============================================================================

ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_select" ON sops FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON sops FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON sops FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON sops FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_select" ON checklists FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON checklists FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON checklists FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON checklists FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_select" ON templates FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_insert" ON templates FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_update" ON templates FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "org_isolation_delete" ON templates FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

-- =============================================================================
-- RLS — Junction Tables (SOP)
-- =============================================================================

ALTER TABLE sop_core_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON sop_core_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON sop_core_activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON sop_core_activities FOR DELETE
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE sop_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON sop_processes FOR SELECT
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON sop_processes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON sop_processes FOR DELETE
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE sop_subfunctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON sop_subfunctions FOR SELECT
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON sop_subfunctions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON sop_subfunctions FOR DELETE
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE sop_functions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON sop_functions FOR SELECT
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON sop_functions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON sop_functions FOR DELETE
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE sop_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON sop_roles FOR SELECT
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON sop_roles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON sop_roles FOR DELETE
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE sop_people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON sop_people FOR SELECT
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON sop_people FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON sop_people FOR DELETE
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE sop_software ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON sop_software FOR SELECT
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON sop_software FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON sop_software FOR DELETE
  USING (EXISTS (SELECT 1 FROM sops s WHERE s.id = sop_id AND s.organization_id IN (SELECT get_user_org_ids())));

-- =============================================================================
-- RLS — Junction Tables (Checklist)
-- =============================================================================

ALTER TABLE checklist_core_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON checklist_core_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON checklist_core_activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON checklist_core_activities FOR DELETE
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE checklist_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON checklist_processes FOR SELECT
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON checklist_processes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON checklist_processes FOR DELETE
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE checklist_subfunctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON checklist_subfunctions FOR SELECT
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON checklist_subfunctions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON checklist_subfunctions FOR DELETE
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE checklist_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON checklist_roles FOR SELECT
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON checklist_roles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON checklist_roles FOR DELETE
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE checklist_people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON checklist_people FOR SELECT
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON checklist_people FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON checklist_people FOR DELETE
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE checklist_software ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON checklist_software FOR SELECT
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON checklist_software FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON checklist_software FOR DELETE
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.organization_id IN (SELECT get_user_org_ids())));

-- =============================================================================
-- RLS — Junction Tables (Template)
-- =============================================================================

ALTER TABLE template_core_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON template_core_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON template_core_activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON template_core_activities FOR DELETE
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE template_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON template_processes FOR SELECT
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON template_processes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON template_processes FOR DELETE
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE template_subfunctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON template_subfunctions FOR SELECT
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON template_subfunctions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON template_subfunctions FOR DELETE
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE template_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON template_roles FOR SELECT
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON template_roles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON template_roles FOR DELETE
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE template_software ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON template_software FOR SELECT
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON template_software FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON template_software FOR DELETE
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE template_sops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON template_sops FOR SELECT
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON template_sops FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON template_sops FOR DELETE
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));

ALTER TABLE template_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "junction_select" ON template_checklists FOR SELECT
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_insert" ON template_checklists FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "junction_delete" ON template_checklists FOR DELETE
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND t.organization_id IN (SELECT get_user_org_ids())));
