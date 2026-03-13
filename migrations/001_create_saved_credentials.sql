-- Migration: Create saved_credentials table
-- Purpose: Store encrypted Salesforce login credentials for quick org switching
-- Date: 2025-01-XX

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create saved_credentials table
CREATE TABLE IF NOT EXISTS saved_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_name VARCHAR(255) NOT NULL,
  login_url VARCHAR(500) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL,
  security_token_encrypted TEXT,
  password_iv VARCHAR(32) NOT NULL,
  token_iv VARCHAR(32),
  auth_method VARCHAR(20) NOT NULL CHECK (auth_method IN ('oauth', 'direct')),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id VARCHAR(255),
  CONSTRAINT unique_profile_per_user UNIQUE (profile_name, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_credentials_user_id ON saved_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_credentials_last_used ON saved_credentials(last_used DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_saved_credentials_profile_name ON saved_credentials(profile_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_credentials_updated_at
  BEFORE UPDATE ON saved_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verify table creation
\d saved_credentials
