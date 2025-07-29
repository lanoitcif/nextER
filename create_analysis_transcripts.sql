-- Create the analysis_transcripts table
CREATE TABLE public.analysis_transcripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_type_id TEXT REFERENCES public.company_types(id) ON DELETE SET NULL,
  transcript TEXT NOT NULL,
  analysis_result TEXT,
  review_result TEXT,
  provider TEXT NOT NULL,
  model TEXT,
  review_provider TEXT,
  review_model TEXT,
  feedback SMALLINT, -- 1 for thumbs up, -1 for thumbs down, 0 for no feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_analysis_transcripts_user_id ON public.analysis_transcripts(user_id);
CREATE INDEX idx_analysis_transcripts_company_id ON public.analysis_transcripts(company_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.analysis_transcripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analysis_transcripts
CREATE POLICY "Users can view their own transcripts" ON public.analysis_transcripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transcripts" ON public.analysis_transcripts
  FOR SELECT TO authenticated
  USING (
    (SELECT access_level FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
      OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Users can insert their own transcripts" ON public.analysis_transcripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON public.analysis_transcripts
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
