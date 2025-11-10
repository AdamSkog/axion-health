-- Health Metrics Table for storing health data from Sahha/mock
-- Run this SQL in your Supabase SQL Editor if the table doesn't exist

CREATE TABLE IF NOT EXISTS health_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_type TEXT NOT NULL,
    value TEXT,  -- Using TEXT to handle both numeric and string values (e.g., "120/80" for blood pressure)
    unit TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_timestamp ON health_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_metric_type ON health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_timestamp ON health_metrics(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_type ON health_metrics(user_id, metric_type);

-- Optional: Create unique constraint to prevent duplicates
-- Note: This will cause duplicates to be rejected. Remove if you want to allow duplicate entries.
CREATE UNIQUE INDEX IF NOT EXISTS idx_health_metrics_unique 
    ON health_metrics(user_id, timestamp, metric_type);

-- Enable Row Level Security
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own health metrics
CREATE POLICY "Users can view own health metrics"
    ON health_metrics
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own health metrics
CREATE POLICY "Users can insert own health metrics"
    ON health_metrics
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own health metrics
CREATE POLICY "Users can update own health metrics"
    ON health_metrics
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own health metrics
CREATE POLICY "Users can delete own health metrics"
    ON health_metrics
    FOR DELETE
    USING (auth.uid() = user_id);

-- Optional: Add function to clean up old metrics (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_health_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM health_metrics
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Note: If you need to store numeric values as floats instead of text,
-- modify the value column type:
-- ALTER TABLE health_metrics ALTER COLUMN value TYPE DOUBLE PRECISION USING value::double precision;
-- But be aware this will fail for non-numeric values like blood pressure "120/80"

