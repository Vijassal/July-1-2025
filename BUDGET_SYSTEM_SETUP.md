# Budget System Setup

This document outlines the budget management system implementation for the modernized events app.

## Overview

The budget system allows users to:
- Create and manage budget items for events
- Track logged payments against budget items
- Break down payments into individual items with costs
- Convert currencies and track exchange rates
- Link budget items to vendors and events

## Database Tables

### 1. `budgets`
Main budget items table containing:
- Purchase description
- Vendor reference (optional)
- Event reference (optional)
- Category, cost, currency
- Payment details
- Conversion rates and amounts
- Account instance scoping

### 2. `logged_payments`
Payments made against budget items:
- Links to budget via `budget_id`
- Payment amount, method, date
- Payment description and item
- Account instance scoping

### 3. `logged_item_costs`
Detailed breakdown of payment items:
- Links to logged payment via `logged_payment_id`
- Item name, per-cost, subtotal, total
- Account instance scoping

### 4. `exchange_rates`
Currency conversion rates:
- From/to currency pairs
- Rate and date
- Account instance scoping

## Setup Instructions

### 1. Run Database Setup Script

Execute the SQL script `scripts/create-budget-system-tables.sql` in your Supabase database to:
- Create all budget-related tables
- Set up proper foreign key relationships
- Enable Row Level Security (RLS)
- Create necessary indexes
- Set up RLS policies for multi-tenant access

### 2. Verify Account Context

Ensure the budget page has access to the account context:
```typescript
import { useAccount } from "@/lib/account-context"
const { currentAccount } = useAccount()
```

### 3. Test the System

1. Navigate to `/budget` in your application
2. Create a budget item with vendor and event selection
3. Add logged payments to the budget item
4. Break down payments into individual items
5. Verify all data is properly saved and retrieved

## Features Implemented

### Budget Items Tab
- ✅ Add new budget items
- ✅ Edit existing budget items
- ✅ Delete budget items
- ✅ Link to vendors and events
- ✅ Currency conversion
- ✅ Payment tracking

### Logged Payments Tab
- ✅ Add new payments (standalone)
- ✅ Add payments to specific budget items
- ✅ Edit existing payments
- ✅ Delete payments
- ✅ Payment method tracking

### Item Breakdown Tab
- ✅ Add new items (standalone)
- ✅ Add items to specific payments
- ✅ Edit existing items
- ✅ Delete items
- ✅ Cost breakdown (per-cost, subtotal, total)

## Data Relationships

```
Budget Items (budgets)
├── Linked to Vendors (vendors)
├── Linked to Events (events)
└── Has many Logged Payments (logged_payments)
    └── Has many Item Costs (logged_item_costs)
```

## Security

- All tables use Row Level Security (RLS)
- Data is scoped to account instances
- Professional users can access accounts they have access to
- Regular users can only access their own accounts

## Currency Support

- Default currency: USD
- Supported currencies: USD, EUR, GBP, CAD
- Automatic currency conversion based on exchange rates
- Exchange rates stored per account instance

## Usage Examples

### Creating a Budget Item
1. Go to Budget Items tab
2. Click "Add Budget Item"
3. Fill in purchase description, vendor, event, category, cost
4. Select currency and payment details
5. Save the budget item

### Adding a Payment
1. Go to Logged Payments tab
2. Click "Add Payment"
3. Fill in payment details (amount, method, date)
4. Save the payment

### Adding Item Breakdown
1. Go to Item Breakdown tab
2. Click "Add Item"
3. Fill in item details (name, per-cost, subtotal, total)
4. Save the item

## Troubleshooting

### Common Issues

1. **Foreign Key Errors**: Ensure the database setup script has been run
2. **RLS Policy Errors**: Check that user has proper account access
3. **Missing Data**: Verify account context is properly loaded
4. **Currency Conversion Issues**: Check exchange rates are populated

### Database Verification

Run these queries to verify setup:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('budgets', 'logged_payments', 'logged_item_costs', 'exchange_rates');

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('budgets', 'logged_payments', 'logged_item_costs', 'exchange_rates');

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('budgets', 'logged_payments', 'logged_item_costs', 'exchange_rates');
``` 