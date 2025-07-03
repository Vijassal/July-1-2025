-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_categories_account_instance_id ON categories(account_instance_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage categories in their accounts" ON categories
  FOR ALL USING (
    account_instance_id IN (
      SELECT id FROM account_instances WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage categories in accessible accounts" ON categories
  FOR ALL USING (
    account_instance_id IN (
      SELECT account_instance_id FROM professional_account_access 
      WHERE professional_id = auth.uid() AND is_active = true
    )
  );

-- Insert default categories
INSERT INTO categories (name, account_instance_id)
SELECT 'Food & Beverage', id FROM account_instances 
WHERE id NOT IN (SELECT DISTINCT account_instance_id FROM categories WHERE name = 'Food & Beverage');

INSERT INTO categories (name, account_instance_id)
SELECT 'Photography', id FROM account_instances 
WHERE id NOT IN (SELECT DISTINCT account_instance_id FROM categories WHERE name = 'Photography');

INSERT INTO categories (name, account_instance_id)
SELECT 'Decoration', id FROM account_instances 
WHERE id NOT IN (SELECT DISTINCT account_instance_id FROM categories WHERE name = 'Decoration');

INSERT INTO categories (name, account_instance_id)
SELECT 'Music', id FROM account_instances 
WHERE id NOT IN (SELECT DISTINCT account_instance_id FROM categories WHERE name = 'Music');

INSERT INTO categories (name, account_instance_id)
SELECT 'Transportation', id FROM account_instances 
WHERE id NOT IN (SELECT DISTINCT account_instance_id FROM categories WHERE name = 'Transportation');

INSERT INTO categories (name, account_instance_id)
SELECT 'Venue', id FROM account_instances 
WHERE id NOT IN (SELECT DISTINCT account_instance_id FROM categories WHERE name = 'Venue');

INSERT INTO categories (name, account_instance_id)
SELECT 'Other', id FROM account_instances 
WHERE id NOT IN (SELECT DISTINCT account_instance_id FROM categories WHERE name = 'Other'); 