ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for debug" ON app_configurations;

CREATE POLICY "Allow all for debug"
  ON app_configurations
  FOR ALL
  USING (true)
  WITH CHECK (true); 