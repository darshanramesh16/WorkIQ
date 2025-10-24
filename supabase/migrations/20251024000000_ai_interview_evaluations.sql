-- Create interview evaluations table
CREATE TABLE IF NOT EXISTS interview_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  ai_score INTEGER,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON interview_evaluations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON interview_evaluations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON interview_evaluations
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();