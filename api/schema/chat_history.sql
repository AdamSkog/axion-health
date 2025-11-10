-- Chat History Table for Conversation Memory
-- Run this SQL in your Supabase SQL Editor to create the table

CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'function')),
    content TEXT,
    function_calls JSONB,
    tool_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own chat history
CREATE POLICY "Users can view own chat history"
    ON chat_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own chat history
CREATE POLICY "Users can insert own chat history"
    ON chat_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own chat history
CREATE POLICY "Users can delete own chat history"
    ON chat_history
    FOR DELETE
    USING (auth.uid() = user_id);

-- Optional: Add function to clean up old history (keep last 50 messages per user)
CREATE OR REPLACE FUNCTION cleanup_old_chat_history()
RETURNS void AS $$
BEGIN
    DELETE FROM chat_history
    WHERE id IN (
        SELECT id FROM chat_history
        WHERE user_id IN (
            SELECT DISTINCT user_id FROM chat_history
        )
        ORDER BY created_at DESC
        OFFSET 50
    );
END;
$$ LANGUAGE plpgsql;

