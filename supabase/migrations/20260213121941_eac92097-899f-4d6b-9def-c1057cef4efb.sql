
-- Add recurrence support to calendar_events
ALTER TABLE public.calendar_events
  ADD COLUMN recurrence_type text DEFAULT NULL,
  ADD COLUMN recurrence_days integer[] DEFAULT NULL;

-- recurrence_type: 'weekly', 'monthly', 'yearly', or NULL (no recurrence)
-- recurrence_days: for weekly, array of ISO day numbers (1=Monday, 7=Sunday)
-- For monthly/yearly, recurrence_days is not used (uses the event_date's day-of-month or day-of-year)
