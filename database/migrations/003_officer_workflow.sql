ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department_id VARCHAR(100)
  CHECK (department_id IS NULL OR department_id IN (
    'dept-water', 'dept-roads', 'dept-sanitation', 'dept-electrical',
    'dept-safety', 'dept-health', 'dept-edu', 'dept-transport'
  ));

CREATE TABLE IF NOT EXISTS grievance_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recommendation JSONB NOT NULL CHECK (jsonb_typeof(recommendation) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, grievance_id)
);

CREATE INDEX IF NOT EXISTS grievance_ai_recommendations_grievance_created_idx
  ON grievance_ai_recommendations (grievance_id, created_at DESC);

CREATE TABLE IF NOT EXISTS grievance_ai_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL UNIQUE,
  officer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decision VARCHAR(16) NOT NULL
    CHECK (decision IN ('ACCEPTED', 'MODIFIED', 'REJECTED')),
  original_recommendation JSONB NOT NULL
    CHECK (jsonb_typeof(original_recommendation) = 'object'),
  final_recommendation JSONB
    CHECK (final_recommendation IS NULL OR jsonb_typeof(final_recommendation) = 'object'),
  officer_note TEXT
    CHECK (officer_note IS NULL OR length(trim(officer_note)) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (recommendation_id, grievance_id)
    REFERENCES grievance_ai_recommendations(id, grievance_id) ON DELETE CASCADE,
  CHECK (decision = 'REJECTED' OR final_recommendation IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS grievance_ai_decisions_grievance_created_idx
  ON grievance_ai_decisions (grievance_id, created_at DESC);

CREATE INDEX IF NOT EXISTS grievance_ai_decisions_officer_created_idx
  ON grievance_ai_decisions (officer_id, created_at DESC);
