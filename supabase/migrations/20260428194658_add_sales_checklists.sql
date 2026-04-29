-- sales_checklists: named checklists belonging to a company
CREATE TABLE sales_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sales_checklist_questions: questions on a checklist (supports conditional nesting)
CREATE TABLE sales_checklist_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES sales_checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  answer_type TEXT NOT NULL DEFAULT 'yes_no' CHECK (answer_type IN ('yes_no', 'text')),
  display_order INTEGER NOT NULL DEFAULT 0,
  parent_question_id UUID REFERENCES sales_checklist_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sales_checklist_plan_links: many-to-many between checklists and service plans
CREATE TABLE sales_checklist_plan_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES sales_checklists(id) ON DELETE CASCADE,
  service_plan_id UUID NOT NULL REFERENCES service_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(checklist_id, service_plan_id)
);

-- Enable RLS
ALTER TABLE sales_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_checklist_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_checklist_plan_links ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as service_plans)
CREATE POLICY "Company members can manage sales_checklists"
  ON sales_checklists FOR ALL
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Company members can manage sales_checklist_questions"
  ON sales_checklist_questions FOR ALL
  USING (checklist_id IN (
    SELECT id FROM sales_checklists
    WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
  ));

CREATE POLICY "Company members can manage sales_checklist_plan_links"
  ON sales_checklist_plan_links FOR ALL
  USING (checklist_id IN (
    SELECT id FROM sales_checklists
    WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
  ));
