# SaaS Subscription Implementation

## Overview
This document outlines the complete SaaS subscription system implementation for the modernized events app, including subscription management, trial periods, payment integration, and usage tracking.

## Key Features Implemented

### 1. **Subscription Plans**
- **Regular User Plans**: Basic ($9.99), Standard ($19.99), Premium ($39.99)
- **Professional User Plans**: Starter ($49.99), Growth ($99.99), Enterprise ($199.99)
- **Vendor Plans**: Free access with limited features
- **Trial Periods**: 15 days for regular users, 5 days for professionals, no trial for vendors

### 2. **Trial Management**
- Automatic trial creation on user registration
- Trial expiration tracking
- Graceful transition to paid plans
- Trial limits enforcement

### 3. **Payment Integration**
- Stripe/Chargebee ready webhook system
- Payment provider agnostic design
- Subscription status management
- Payment failure handling

### 4. **Usage Tracking**
- Event creation limits
- Participant count limits
- Professional account limits
- Monthly usage tracking

## Database Changes

### New Tables Created

#### `subscription_plans`
```sql
- id (UUID, Primary Key)
- name (TEXT)
- description (TEXT)
- user_type (regular|professional|vendor)
- price_monthly (DECIMAL)
- price_yearly (DECIMAL)
- features (JSONB)
- max_events (INTEGER)
- max_participants (INTEGER)
- max_professional_accounts (INTEGER)
- is_active (BOOLEAN)
```

#### `user_subscriptions`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- plan_id (UUID, Foreign Key)
- status (trial|active|past_due|canceled|unpaid)
- current_period_start (TIMESTAMP)
- current_period_end (TIMESTAMP)
- trial_start (TIMESTAMP)
- trial_end (TIMESTAMP)
- payment_provider (TEXT)
- payment_provider_subscription_id (TEXT)
- payment_provider_customer_id (TEXT)
```

#### `subscription_usage`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- account_instance_id (UUID, Foreign Key)
- usage_type (TEXT)
- usage_count (INTEGER)
- usage_date (DATE)
```

#### `payment_webhooks`
```sql
- id (UUID, Primary Key)
- provider (TEXT)
- event_type (TEXT)
- event_id (TEXT)
- payload (JSONB)
- processed (BOOLEAN)
```

### Updated Tables

#### `account_instances`
```sql
ADDED:
- subscription_status (trial|active|past_due|canceled|unpaid)
- trial_ends_at (TIMESTAMP)
- subscription_ends_at (TIMESTAMP)
- max_events (INTEGER)
- max_participants (INTEGER)
- max_professional_accounts (INTEGER)

REMOVED:
- owner_id (unused field)
```

#### `user_type_registrations`
```sql
ADDED:
- subscription_id (UUID, Foreign Key)
- requires_payment (BOOLEAN)
- payment_required_at (TIMESTAMP)
```

## User Flow Implementation

### 1. **New User Registration**
```
User registers → Account instance created → Trial subscription created → 15-day trial starts
```

### 2. **Trial to Paid Conversion**
```
Trial expires → Payment required → User selects plan → Payment processed → Subscription upgraded
```

### 3. **Professional User Transition**
```
Regular user → Wants professional access → Payment required → Professional plan selected → Access granted
```

### 4. **Vendor Registration**
```
Vendor registers → Free account created → Limited access granted → No payment required
```

## Subscription Plans Details

### Regular User Plans

#### Basic Plan ($9.99/month, $99.99/year)
- 1 event
- 50 participants
- Event planning tools
- Guest management
- RSVP tracking
- Basic budget tools
- Email support

#### Standard Plan ($19.99/month, $199.99/year)
- 3 events
- 150 participants
- All Basic features
- Advanced budget tools
- Website builder
- Priority support

#### Premium Plan ($39.99/month, $399.99/year)
- 10 events
- 500 participants
- All Standard features
- Vendor management
- Phone support

### Professional User Plans

#### Professional Starter ($49.99/month, $499.99/year)
- 5 client accounts
- 1000 participants total
- Multi-account access
- Client management
- Professional tools
- Basic analytics

#### Professional Growth ($99.99/month, $999.99/year)
- 15 client accounts
- 3000 participants total
- All Starter features
- Advanced analytics
- White-label options

#### Professional Enterprise ($199.99/month, $1999.99/year)
- 50 client accounts
- 10000 participants total
- All Growth features
- API access
- Dedicated support

### Vendor Plans

#### Vendor Basic (Free)
- Profile management
- Client communication
- Booking management
- No event creation
- No participant management

## Database Functions

### Core Functions

#### `has_active_subscription(user_uuid UUID)`
Returns boolean indicating if user has active subscription

#### `get_user_subscription_plan(user_uuid UUID)`
Returns user's current subscription plan details

#### `create_trial_subscription(user_uuid UUID, user_type TEXT)`
Creates trial subscription for new user

#### `upgrade_user_subscription(user_uuid UUID, new_plan_id UUID, ...)`
Upgrades user subscription after payment

## RLS Policies

### Subscription Tables
- Users can only view their own subscriptions
- Subscription plans are read-only for all users
- Payment webhooks are system-only access

### Updated Account Access
- Account access requires active subscription
- Professional access requires professional subscription
- Vendor access is always granted (free)

## Integration Points

### 1. **Payment Provider Integration**
```typescript
// Webhook endpoint for payment providers
POST /api/webhooks/payment
{
  "provider": "stripe",
  "event_type": "customer.subscription.created",
  "event_id": "evt_123",
  "payload": { ... }
}
```

### 2. **Usage Tracking**
```typescript
// Track usage when user performs actions
await SubscriptionService.trackUsage(userId, accountId, "events", 1)
await SubscriptionService.trackUsage(userId, accountId, "participants", 1)
```

### 3. **Limit Checking**
```typescript
// Check if user can perform action
const limit = await SubscriptionService.checkUsageLimit(
  userId, 
  accountId, 
  "create_event"
)
```

## Implementation Files

### Database
- `scripts/saas-subscription-setup.sql` - Complete database setup

### Services
- `lib/subscription-service.ts` - Subscription management service
- `lib/account-service.ts` - Updated account service
- `lib/account-initialization.ts` - Updated initialization service

### Types
- `lib/database.types.ts` - Updated with subscription types

### Context
- `lib/account-context.tsx` - Updated with subscription context

## Usage Examples

### Check User Subscription
```typescript
const hasActive = await SubscriptionService.hasActiveSubscription(userId)
const plan = await SubscriptionService.getUserSubscriptionPlan(userId)
```

### Upgrade Subscription
```typescript
const subscriptionId = await SubscriptionService.upgradeSubscription(
  userId,
  planId,
  "stripe",
  "sub_123",
  "cus_456"
)
```

### Track Usage
```typescript
await SubscriptionService.trackUsage(userId, accountId, "events", 1)
```

### Check Limits
```typescript
const { allowed, current, limit } = await SubscriptionService.checkUsageLimit(
  userId,
  accountId,
  "create_event"
)
```

## Payment Provider Setup

### Stripe Integration
1. Create Stripe account
2. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Configure webhook events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Chargebee Integration
1. Create Chargebee account
2. Set up webhook endpoint: `https://your-domain.com/api/webhooks/chargebee`
3. Configure webhook events (similar to Stripe)

## Security Considerations

### Data Protection
- All subscription data is protected by RLS policies
- Payment provider IDs are stored securely
- Webhook payloads are validated before processing

### Access Control
- Users can only access their own subscription data
- Professional access is limited to granted accounts
- Vendor access is restricted to their own profile

### Payment Security
- Payment processing is handled by external providers
- No sensitive payment data is stored in our database
- Webhook signatures are validated

## Monitoring and Analytics

### Key Metrics to Track
- Trial conversion rates
- Subscription churn rates
- Usage patterns by plan
- Payment success/failure rates
- Revenue by plan type

### Usage Tracking
- Monthly active users
- Feature usage by subscription tier
- Account limits utilization
- Professional account access patterns

## Future Enhancements

### Planned Features
1. **Usage Analytics Dashboard** - Track usage patterns
2. **Billing Portal** - User self-service billing
3. **Plan Comparison Tool** - Help users choose plans
4. **Usage Alerts** - Notify users approaching limits
5. **Bulk Operations** - Professional user bulk actions

### Integration Opportunities
1. **Email Marketing** - Trial expiration reminders
2. **Customer Support** - Subscription status integration
3. **Analytics** - Revenue and usage reporting
4. **Mobile App** - Subscription management

## Testing Checklist

### Database Layer
- [ ] Trial subscription creation works
- [ ] Subscription upgrade process works
- [ ] Usage tracking functions correctly
- [ ] RLS policies enforce access control
- [ ] Webhook processing handles all events

### Application Layer
- [ ] Registration creates trial subscriptions
- [ ] Payment flow works end-to-end
- [ ] Usage limits are enforced
- [ ] Professional access requires subscription
- [ ] Vendor access is properly limited

### Integration Layer
- [ ] Payment provider webhooks work
- [ ] Subscription status updates correctly
- [ ] Payment failures are handled
- [ ] Trial expiration is processed

## Deployment Notes

### Database Migration
1. Run `scripts/saas-subscription-setup.sql` in Supabase
2. Verify all tables and functions are created
3. Test trial subscription creation
4. Verify RLS policies are working

### Environment Variables
```env
# Payment Provider Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CHARGEBEE_API_KEY=test_...
CHARGEBEE_WEBHOOK_SECRET=whsec_...
```

### Monitoring Setup
1. Set up webhook monitoring
2. Configure usage tracking alerts
3. Set up subscription status monitoring
4. Monitor payment success rates

## Conclusion

The SaaS subscription system provides a complete solution for:
- **Trial management** with automatic creation and expiration
- **Payment integration** ready for Stripe/Chargebee
- **Usage tracking** with limits enforcement
- **Professional multi-account** access control
- **Vendor free access** with appropriate limitations

The system is designed to be scalable, secure, and maintainable while providing a smooth user experience for all user types. 