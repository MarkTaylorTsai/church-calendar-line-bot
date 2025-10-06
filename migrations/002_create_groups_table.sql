-- Create groups table to track groups when bot joins
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  line_group_id TEXT UNIQUE NOT NULL,
  group_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_groups_line_group_id ON groups(line_group_id);
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active);
