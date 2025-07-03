-- LLM Transcript Analyzer Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  can_use_owner_key BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User API keys table (encrypted storage)
CREATE TABLE public.user_api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'cohere')),
  encrypted_api_key TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, nickname)
);

-- Prompts table (for storing pre-built system prompts)
CREATE TABLE public.prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage logs table (for tracking API usage)
CREATE TABLE public.usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  prompt_id UUID REFERENCES public.prompts(id),
  token_count INTEGER,
  cost_estimate DECIMAL(10,6),
  used_owner_key BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON public.user_api_keys(provider);
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_api_keys
CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for prompts (read-only for users, admin manages via service role)
CREATE POLICY "Users can view active prompts" ON public.prompts
  FOR SELECT USING (is_active = TRUE);

-- RLS Policies for usage_logs
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (true);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default prompts
INSERT INTO public.prompts (name, display_name, description, system_prompt, category) VALUES
(
  'meeting_summary',
  'Meeting Summary',
  'Summarize meeting transcripts with key points and action items',
  'You are an expert at analyzing meeting transcripts. Please provide a comprehensive summary that includes:

1. **Key Discussion Points**: Main topics covered during the meeting
2. **Decisions Made**: Any concrete decisions or resolutions reached
3. **Action Items**: Specific tasks assigned with responsible parties (if mentioned)
4. **Important Dates/Deadlines**: Any mentioned timelines or due dates
5. **Next Steps**: What should happen following this meeting

Format your response in clear sections with bullet points where appropriate. Be concise but thorough.',
  'meetings'
),
(
  'interview_analysis',
  'Interview Analysis',
  'Analyze interview transcripts for key insights and themes',
  'You are an expert at analyzing interview transcripts. Please provide a thorough analysis that includes:

1. **Key Themes**: Main topics and patterns that emerged
2. **Notable Quotes**: Important or revealing statements from the interviewee
3. **Insights**: Your analysis of what the responses reveal
4. **Recommendations**: Suggested follow-up questions or areas for deeper exploration
5. **Summary**: Overall impression and key takeaways

Maintain objectivity and focus on factual observations while highlighting significant patterns or insights.',
  'interviews'
),
(
  'sentiment_analysis',
  'Sentiment Analysis',
  'Analyze the emotional tone and sentiment of conversations',
  'You are an expert at sentiment analysis and emotional intelligence. Please analyze this transcript for:

1. **Overall Sentiment**: General emotional tone (positive, negative, neutral)
2. **Emotional Shifts**: How sentiment changes throughout the conversation
3. **Key Emotional Moments**: Specific points where strong emotions are expressed
4. **Participant Dynamics**: How different speakers interact emotionally
5. **Underlying Concerns**: Any hidden or implicit emotional themes

Provide specific examples from the text to support your analysis. Be sensitive and professional in your assessment.',
  'analysis'
),
(
  'sales_call_analysis',
  'Sales Call Analysis',
  'Analyze sales conversations for opportunities and insights',
  'You are an expert sales analyst. Please analyze this sales call transcript for:

1. **Customer Needs**: What problems or needs did the customer express?
2. **Pain Points**: What challenges or frustrations were mentioned?
3. **Buying Signals**: Positive indicators of purchase intent
4. **Objections**: Concerns or resistance expressed by the customer
5. **Next Steps**: Recommended follow-up actions
6. **Opportunities**: Areas for upselling or additional value delivery
7. **Coaching Notes**: Suggestions for improving the sales approach

Focus on actionable insights that can improve future sales performance.',
  'sales'
);