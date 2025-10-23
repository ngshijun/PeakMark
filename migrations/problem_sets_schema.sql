-- Problem Sets Feature Database Migration
-- Run this SQL in your Supabase SQL Editor

-- 1. Add new columns to question_sets table
ALTER TABLE question_sets
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS show_explanations BOOLEAN DEFAULT TRUE;

-- 2. Create question_set_attempts table
CREATE TABLE IF NOT EXISTS question_set_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create question_set_answers table
CREATE TABLE IF NOT EXISTS question_set_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES question_set_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES question_set_questions(id) ON DELETE CASCADE,
  selected_answer INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_question_set_attempts_question_set_id
  ON question_set_attempts(question_set_id);

CREATE INDEX IF NOT EXISTS idx_question_set_attempts_student_id
  ON question_set_attempts(student_id);

CREATE INDEX IF NOT EXISTS idx_question_set_answers_attempt_id
  ON question_set_answers(attempt_id);

CREATE INDEX IF NOT EXISTS idx_question_set_answers_question_id
  ON question_set_answers(question_id);

-- 5. Add RLS (Row Level Security) policies

-- Enable RLS on new tables
ALTER TABLE question_set_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_set_answers ENABLE ROW LEVEL SECURITY;

-- question_set_attempts policies
-- Students can view their own attempts
CREATE POLICY "Students can view own attempts"
  ON question_set_attempts FOR SELECT
  USING (auth.uid() = student_id);

-- Students can insert their own attempts
CREATE POLICY "Students can create own attempts"
  ON question_set_attempts FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own attempts
CREATE POLICY "Students can update own attempts"
  ON question_set_attempts FOR UPDATE
  USING (auth.uid() = student_id);

-- Teachers can view attempts in their classrooms
CREATE POLICY "Teachers can view classroom attempts"
  ON question_set_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM question_sets qs
      JOIN classrooms c ON c.id = qs.classroom_id
      WHERE qs.id = question_set_attempts.question_set_id
      AND c.teacher_id = auth.uid()
    )
  );

-- question_set_answers policies
-- Students can view their own answers
CREATE POLICY "Students can view own answers"
  ON question_set_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM question_set_attempts qsa
      WHERE qsa.id = question_set_answers.attempt_id
      AND qsa.student_id = auth.uid()
    )
  );

-- Students can insert their own answers
CREATE POLICY "Students can create own answers"
  ON question_set_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM question_set_attempts qsa
      WHERE qsa.id = question_set_answers.attempt_id
      AND qsa.student_id = auth.uid()
    )
  );

-- Students can update their own answers (before submission)
CREATE POLICY "Students can update own answers"
  ON question_set_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM question_set_attempts qsa
      WHERE qsa.id = question_set_answers.attempt_id
      AND qsa.student_id = auth.uid()
      AND qsa.is_completed = FALSE
    )
  );

-- Teachers can view answers in their classrooms
CREATE POLICY "Teachers can view classroom answers"
  ON question_set_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM question_set_attempts qsa
      JOIN question_sets qs ON qs.id = qsa.question_set_id
      JOIN classrooms c ON c.id = qs.classroom_id
      WHERE qsa.id = question_set_answers.attempt_id
      AND c.teacher_id = auth.uid()
    )
  );

-- 6. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Add triggers for updated_at
CREATE TRIGGER update_question_sets_updated_at
  BEFORE UPDATE ON question_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_set_attempts_updated_at
  BEFORE UPDATE ON question_set_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_set_answers_updated_at
  BEFORE UPDATE ON question_set_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration complete!
-- After running this migration, regenerate your TypeScript types using:
-- npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
