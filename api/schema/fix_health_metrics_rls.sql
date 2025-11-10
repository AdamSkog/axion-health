-- Fix RLS policies for health_metrics table
-- This allows authenticated users to insert/update/delete their own data

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own health metrics" ON health_metrics;
DROP POLICY IF EXISTS "Users can view their own health metrics" ON health_metrics;
DROP POLICY IF EXISTS "Users can update their own health metrics" ON health_metrics;
DROP POLICY IF EXISTS "Users can delete their own health metrics" ON health_metrics;

-- Enable RLS (if not already enabled)
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can INSERT their own health metrics
CREATE POLICY "Users can insert their own health metrics"
ON health_metrics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can SELECT (view) their own health metrics
CREATE POLICY "Users can view their own health metrics"
ON health_metrics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can UPDATE their own health metrics
CREATE POLICY "Users can update their own health metrics"
ON health_metrics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE their own health metrics
CREATE POLICY "Users can delete their own health metrics"
ON health_metrics
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Test the policies (optional - comment out if not needed)
-- This will only work if you have a test user session
-- SELECT * FROM health_metrics WHERE user_id = auth.uid();

