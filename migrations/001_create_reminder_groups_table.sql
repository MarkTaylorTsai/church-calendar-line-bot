-- Create reminder_groups table to store group IDs for reminders
CREATE TABLE IF NOT EXISTS reminder_groups (
  id SERIAL PRIMARY KEY,
  group_id VARCHAR(255) UNIQUE NOT NULL,
  group_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reminder_groups_group_id ON reminder_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_reminder_groups_is_active ON reminder_groups(is_active);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE reminder_groups ENABLE ROW LEVEL SECURITY;
