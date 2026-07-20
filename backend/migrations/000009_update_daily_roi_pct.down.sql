DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM platform_settings 
        WHERE daily_roi_pct >= 10 OR daily_roi_pct <= -10
    ) THEN
        RAISE EXCEPTION 'Cannot downgrade daily_roi_pct to NUMERIC(5,4): one or more values exceed the maximum capacity (>= 10 or <= -10). Please manually clamp these values or document a cleanup policy before rolling back.';
    END IF;
END $$;

ALTER TABLE platform_settings
ALTER COLUMN daily_roi_pct TYPE NUMERIC(5,4);
