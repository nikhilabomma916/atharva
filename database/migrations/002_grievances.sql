CREATE TABLE IF NOT EXISTS grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 20000),
  category_id VARCHAR(80) NOT NULL,
  street_address VARCHAR(300),
  area VARCHAR(150),
  ward VARCHAR(100),
  city VARCHAR(100) NOT NULL DEFAULT 'Bangalore' CHECK (length(trim(city)) BETWEEN 1 AND 100),
  duration VARCHAR(200),
  affected_count INTEGER CHECK (affected_count IS NULL OR affected_count > 0),
  previous_complaint_reference VARCHAR(120),
  latitude NUMERIC(9, 6) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9, 6) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED'
    CHECK (status IN ('SUBMITTED', 'AI_ANALYZED', 'ASSIGNED', 'IN_PROGRESS',
      'AWAITING_INFORMATION', 'RESOLVED', 'CLOSED', 'SLA_AT_RISK', 'ESCALATED')),
  priority_score SMALLINT CHECK (priority_score IS NULL OR priority_score BETWEEN 0 AND 100),
  priority_level VARCHAR(16)
    CHECK (priority_level IS NULL OR priority_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  department_id VARCHAR(100),
  assigned_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sla_deadline TIMESTAMPTZ,
  complaint_letter TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CHECK ((latitude IS NULL) = (longitude IS NULL))
);

CREATE INDEX IF NOT EXISTS grievances_citizen_created_idx
  ON grievances (citizen_id, created_at DESC);
CREATE INDEX IF NOT EXISTS grievances_status_idx ON grievances (status);
CREATE INDEX IF NOT EXISTS grievances_created_at_idx ON grievances (created_at DESC);
CREATE INDEX IF NOT EXISTS grievances_priority_idx ON grievances (priority_level);
CREATE INDEX IF NOT EXISTS grievances_assigned_officer_idx
  ON grievances (assigned_officer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS grievance_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  subcategory VARCHAR(120),
  issue_type VARCHAR(200),
  extracted_location VARCHAR(300),
  extracted_duration VARCHAR(200),
  affected_population VARCHAR(200),
  urgency VARCHAR(16) NOT NULL
    CHECK (urgency IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  impact VARCHAR(16) NOT NULL CHECK (impact IN ('HIGH', 'MEDIUM', 'LOW')),
  safety_risk BOOLEAN NOT NULL,
  reasoning JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(reasoning) = 'array'),
  confidence NUMERIC(4, 3) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  ai_provider VARCHAR(16) CHECK (ai_provider IS NULL OR ai_provider IN ('ollama', 'fallback')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS grievance_analyses_grievance_created_idx
  ON grievance_analyses (grievance_id, created_at DESC);

CREATE TABLE IF NOT EXISTS grievance_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size >= 0),
  storage_ref TEXT CHECK (storage_ref IS NULL OR storage_ref NOT ILIKE 'data:%'),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS grievance_attachments_grievance_idx
  ON grievance_attachments (grievance_id);

CREATE TABLE IF NOT EXISTS grievance_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  from_status VARCHAR(32)
    CHECK (from_status IS NULL OR from_status IN ('SUBMITTED', 'AI_ANALYZED', 'ASSIGNED',
      'IN_PROGRESS', 'AWAITING_INFORMATION', 'RESOLVED', 'CLOSED', 'SLA_AT_RISK', 'ESCALATED')),
  to_status VARCHAR(32) NOT NULL
    CHECK (to_status IN ('SUBMITTED', 'AI_ANALYZED', 'ASSIGNED', 'IN_PROGRESS',
      'AWAITING_INFORMATION', 'RESOLVED', 'CLOSED', 'SLA_AT_RISK', 'ESCALATED')),
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_role VARCHAR(16) NOT NULL CHECK (changed_by_role IN ('citizen', 'officer', 'admin')),
  note TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS grievance_status_history_grievance_changed_idx
  ON grievance_status_history (grievance_id, changed_at);

CREATE TABLE IF NOT EXISTS grievance_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(16) NOT NULL CHECK (author_role IN ('officer', 'admin')),
  content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS grievance_internal_notes_grievance_created_idx
  ON grievance_internal_notes (grievance_id, created_at);

CREATE TABLE IF NOT EXISTS grievance_citizen_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (length(trim(message)) BETWEEN 1 AND 5000),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS grievance_citizen_updates_grievance_created_idx
  ON grievance_citizen_updates (grievance_id, is_public, created_at);

CREATE TABLE IF NOT EXISTS grievance_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (comment IS NULL OR length(comment) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS grievance_feedback_grievance_created_idx
  ON grievance_feedback (grievance_id, created_at DESC);
