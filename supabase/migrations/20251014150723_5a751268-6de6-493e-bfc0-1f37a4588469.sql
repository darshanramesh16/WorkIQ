-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  5242880, -- 5MB limit
  ARRAY['application/pdf']
);

-- Storage policies for resumes
CREATE POLICY "HR and employees can upload resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'employee'::app_role))
);

CREATE POLICY "HR can view all resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  has_role(auth.uid(), 'hr'::app_role)
);

CREATE POLICY "Employees can view their own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create candidate_resumes table for detailed AI analysis
CREATE TABLE public.candidate_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position_applied TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  resume_text TEXT,
  ai_summary TEXT,
  ai_skill_match JSONB, -- {matched: [], missing: []}
  ai_strengths TEXT[],
  ai_weaknesses TEXT[],
  ai_cultural_fit_score INTEGER CHECK (ai_cultural_fit_score >= 0 AND ai_cultural_fit_score <= 100),
  ai_red_flags TEXT[],
  ai_overall_score INTEGER CHECK (ai_overall_score >= 0 AND ai_overall_score <= 100),
  status TEXT NOT NULL DEFAULT 'pending',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.candidate_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage candidate resumes"
ON public.candidate_resumes FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create interview_questions table
CREATE TABLE public.interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_resume_id UUID REFERENCES public.candidate_resumes(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  questions JSONB NOT NULL, -- [{question: "", answer: "", ai_grade: ""}]
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage interview questions"
ON public.interview_questions FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create recruitment_metrics table
CREATE TABLE public.recruitment_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  total_applications INTEGER DEFAULT 0,
  screened INTEGER DEFAULT 0,
  interviewed INTEGER DEFAULT 0,
  hired INTEGER DEFAULT 0,
  ai_predicted_time_to_hire INTEGER, -- in days
  ai_candidate_quality_avg DECIMAL(3,2),
  ai_insights TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(week_start)
);

ALTER TABLE public.recruitment_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can view recruitment metrics"
ON public.recruitment_metrics FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR can manage recruitment metrics"
ON public.recruitment_metrics FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create employee_resumes table for employee career development
CREATE TABLE public.employee_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  resume_url TEXT NOT NULL,
  resume_text TEXT,
  ai_skill_gaps TEXT[],
  ai_career_path JSONB, -- {current: "", next: [], timeline: ""}
  ai_learning_roadmap JSONB, -- [{skill: "", resources: [], priority: ""}]
  ai_promotion_probability INTEGER CHECK (ai_promotion_probability >= 0 AND ai_promotion_probability <= 100),
  ai_attrition_risk TEXT, -- low, medium, high
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.employee_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can manage their own resumes"
ON public.employee_resumes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = employee_resumes.employee_id
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR and admins can view all employee resumes"
ON public.employee_resumes FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create internal_job_recommendations table
CREATE TABLE public.internal_job_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE NOT NULL,
  ai_match_score INTEGER CHECK (ai_match_score >= 0 AND ai_match_score <= 100),
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, job_posting_id)
);

ALTER TABLE public.internal_job_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own recommendations"
ON public.internal_job_recommendations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = internal_job_recommendations.employee_id
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage recommendations"
ON public.internal_job_recommendations FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create sentiment_tracking table
CREATE TABLE public.sentiment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT NOT NULL, -- happy, neutral, stressed, tired, frustrated
  sentiment_score INTEGER CHECK (sentiment_score >= 1 AND sentiment_score <= 5),
  notes TEXT,
  ai_analysis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

ALTER TABLE public.sentiment_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can manage their own sentiment"
ON public.sentiment_tracking FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = sentiment_tracking.employee_id
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR and managers can view sentiment data"
ON public.sentiment_tracking FOR SELECT
USING (
  has_role(auth.uid(), 'hr'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Create learning_recommendations table
CREATE TABLE public.learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  skill TEXT NOT NULL,
  course_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  course_url TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  estimated_hours INTEGER,
  ai_reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'recommended', -- recommended, in_progress, completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.learning_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view and update their recommendations"
ON public.learning_recommendations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = learning_recommendations.employee_id
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all learning recommendations"
ON public.learning_recommendations FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create hr_collaboration_notes table
CREATE TABLE public.hr_collaboration_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_resume_id UUID REFERENCES public.candidate_resumes(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hr_collaboration_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage collaboration notes"
ON public.hr_collaboration_notes FOR ALL
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_candidate_resumes_updated_at
BEFORE UPDATE ON public.candidate_resumes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_resumes_updated_at
BEFORE UPDATE ON public.employee_resumes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_recommendations_updated_at
BEFORE UPDATE ON public.learning_recommendations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_collaboration_notes_updated_at
BEFORE UPDATE ON public.hr_collaboration_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();