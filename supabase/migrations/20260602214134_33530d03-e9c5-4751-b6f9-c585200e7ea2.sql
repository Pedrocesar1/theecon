-- Add JSON content for TipTap and processing_config for index wizard
ALTER TABLE public.columns
  ADD COLUMN IF NOT EXISTS content_json jsonb;

ALTER TABLE public.indexes
  ADD COLUMN IF NOT EXISTS processing_config jsonb;