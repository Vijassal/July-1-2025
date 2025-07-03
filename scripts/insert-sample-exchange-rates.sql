-- Insert sample exchange rates for testing
-- These are example rates (not real-time rates)

-- USD to other currencies
INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'EUR', 0.85, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'GBP', 0.73, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'JPY', 110.50, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'AUD', 1.35, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'CAD', 1.25, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'CHF', 0.92, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'CNY', 6.45, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'HKD', 7.78, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'NZD', 1.42, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'SEK', 8.65, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'KRW', 1150.00, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'SGD', 1.35, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'NOK', 8.85, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'MXN', 20.50, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'INR', 74.50, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'RUB', 75.00, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'ZAR', 14.50, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'TRY', 8.50, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'BRL', 5.25, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'TWD', 28.00, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'DKK', 6.35, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'PLN', 3.85, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'THB', 32.50, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'USD', 'IDR', 14250.00, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

-- Reverse rates (other currencies to USD)
INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'EUR', 'USD', 1.18, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'GBP', 'USD', 1.37, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'JPY', 'USD', 0.009, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'AUD', 'USD', 0.74, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'CAD', 'USD', 0.80, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'CHF', 'USD', 1.09, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'CNY', 'USD', 0.155, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'HKD', 'USD', 0.129, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'NZD', 'USD', 0.70, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'SEK', 'USD', 0.116, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'KRW', 'USD', 0.00087, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'SGD', 'USD', 0.74, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'NOK', 'USD', 0.113, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'MXN', 'USD', 0.049, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'INR', 'USD', 0.013, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'RUB', 'USD', 0.013, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'ZAR', 'USD', 0.069, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'TRY', 'USD', 0.118, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'BRL', 'USD', 0.19, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'TWD', 'USD', 0.036, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'DKK', 'USD', 0.157, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'PLN', 'USD', 0.26, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'THB', 'USD', 0.031, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, date, account_instance_id)
SELECT 'IDR', 'USD', 0.00007, CURRENT_DATE, id FROM account_instances
ON CONFLICT (from_currency, to_currency, date) DO NOTHING; 