-- Phase 3.7.2: Benefit options and person benefits tables

-- Organization-level benefit option definitions
CREATE TABLE IF NOT EXISTS benefit_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique label per organization
CREATE UNIQUE INDEX IF NOT EXISTS benefit_options_org_label_idx ON benefit_options(organization_id, label);

-- Junction table linking people to benefits
CREATE TABLE IF NOT EXISTS person_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  benefit_option_id UUID NOT NULL REFERENCES benefit_options(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(person_id, benefit_option_id)
);

-- RLS policies for benefit_options
ALTER TABLE benefit_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view benefit options in their org"
  ON benefit_options FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert benefit options in their org"
  ON benefit_options FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete benefit options in their org"
  ON benefit_options FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- RLS policies for person_benefits
ALTER TABLE person_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view person benefits in their org"
  ON person_benefits FOR SELECT
  USING (
    person_id IN (
      SELECT id FROM persons WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage person benefits in their org"
  ON person_benefits FOR INSERT
  WITH CHECK (
    person_id IN (
      SELECT id FROM persons WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can remove person benefits in their org"
  ON person_benefits FOR DELETE
  USING (
    person_id IN (
      SELECT id FROM persons WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );
