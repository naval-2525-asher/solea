-- Migration: seed default WhatsApp number into site_settings
-- Run this in your Supabase SQL editor or via supabase db push

-- Ensure site_settings table exists (it may already exist)
CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default WhatsApp number (safe upsert — won't overwrite if already set)
INSERT INTO site_settings (key, value)
VALUES ('whatsapp_number', '03248922980')
ON CONFLICT (key) DO NOTHING;
