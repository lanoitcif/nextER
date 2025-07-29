# Implementation Plan: Capture and Store Transcripts and Feedback

This document outlines the plan for implementing the functionality to capture and store conversation transcripts, analysis results, and user feedback.

## 1. Database Schema Changes

The following SQL script creates the new `analysis_transcripts` table. This table will store the transcript data, analysis results, and user feedback.

**File:** `create_analysis_transcripts.sql`

```sql
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
```

**To apply this change:**

1.  Connect to the Supabase database.
2.  Execute the SQL script in the `create_analysis_transcripts.sql` file.

## 2. API Changes

### 2.1. Modify `/api/analyze` route

The `/api/analyze` route needs to be updated to store the transcript and analysis results in the new `analysis_transcripts` table.

**File:** `app/api/analyze/route.ts`

**Logic:**

1.  After the LLM analysis is complete, and before returning the response, insert a new record into the `analysis_transcripts` table.
2.  The new record should include the `user_id`, `company_id`, `company_type_id`, `transcript`, `analysis_result`, `review_result`, `provider`, `model`, `review_provider`, and `review_model`.
3.  The `feedback` column should be initialized to `0`.
4.  The `id` of the newly created record should be returned in the response to the client. This will be used to update the feedback later.

### 2.2. Create a new API route for feedback

A new API route, `/api/feedback`, needs to be created to handle user feedback.

**File:** `app/api/feedback/route.ts`

**Logic:**

1.  This route will accept a `POST` request with the `transcript_id` and the `feedback` value (1 for thumbs up, -1 for thumbs down).
2.  It will update the `feedback` column in the `analysis_transcripts` table for the specified `transcript_id`.
3.  The route should be protected to ensure that only the user who created the transcript can provide feedback.

## 3. UI Changes

The `app/dashboard/analyze/page.tsx` component needs to be updated to include the thumbs up/down buttons and the logic to call the new feedback API.

**File:** `app/dashboard/analyze/page.tsx`

**Logic:**

1.  Add two new state variables to the `AppState` interface: `transcriptId` and `feedbackSubmitted`.
2.  After a successful analysis, store the `transcriptId` returned from the `/api/analyze` route in the component's state.
3.  Add thumbs up and thumbs down buttons to the results view. These buttons should be disabled if the `feedbackSubmitted` state is true.
4.  When the user clicks one of the feedback buttons, call the new `/api/feedback` route with the `transcriptId` and the feedback value.
5.  After a successful feedback submission, set the `feedbackSubmitted` state to true to prevent the user from submitting feedback again.

## 4. Testing

After implementing the changes, the following scenarios should be tested:

1.  Verify that a new record is created in the `analysis_transcripts` table after a successful analysis.
2.  Verify that the thumbs up/down buttons are displayed correctly in the UI.
3.  Verify that clicking the thumbs up/down buttons updates the `feedback` column in the `analysis_transcripts` table.
4.  Verify that the feedback buttons are disabled after the user submits feedback.
5.  Verify that the RLS policies are working correctly and that users can only view their own transcripts.
6.  Verify that admins can view all transcripts.
7.  Verify that there are no regressions in the existing functionality.
