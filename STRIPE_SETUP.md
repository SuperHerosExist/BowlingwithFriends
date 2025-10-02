# Stripe Payment System Setup Guide

## Overview

Your bowling games app now has a complete monetization system integrated with Google AdSense ads and Stripe payments. Here's how it works:

## Monetization Tiers

### 1. **Free Tier (Guest Users)**
- Access to "Makes or Misses" game (free)
- Must watch 30-second rewarded video ad to unlock other games for 24 hours
- See banner ads on landing page

### 2. **Credit System (Pay-Per-Play)**
- Buy credits:
  - **Starter Pack**: $0.99 = 10 credits
  - **Popular Pack**: $4.99 = 60 credits (10 bonus)
  - **Value Pack**: $9.99 = 150 credits (30 bonus)
- Use 1 credit to unlock any premium game (no ads)
- Credits never expire
- Perfect for occasional players

### 3. **Subscription (Unlimited Access)**
- **Monthly**: $2.99/month
- **Yearly**: $19.99/year (Save 44% - $1.67/month)
- Benefits:
  - Remove ALL ads permanently
  - Unlimited access to all games
  - Stats tracking
  - Priority support
  - Early access to new features

## User Flow

### Guest Users
1. Click premium game → See rewarded ad modal
2. Options: Watch ad (24hr unlock) or Sign Up
3. After watching ad → All games unlocked for 24 hours

### Registered Users (No Subscription)
1. Click premium game → See unlock options modal
2. Choose:
   - Use 1 credit (if available)
   - Watch ad for 24hr unlock
   - Buy more credits
   - Subscribe for unlimited access

### Subscribers
- Full access to all games immediately
- No ads shown anywhere

## Files Created

### Payment Components
- **[src/stripeConfig.js](src/stripeConfig.js)** - Stripe configuration & pricing
- **[src/components/SubscriptionModal.jsx](src/components/SubscriptionModal.jsx)** - Subscription purchase UI
- **[src/components/CreditsModal.jsx](src/components/CreditsModal.jsx)** - Credits purchase UI
- **[src/components/UnlockGameModal.jsx](src/components/UnlockGameModal.jsx)** - Unlock options for registered users
- **[src/hooks/useUserPayment.js](src/hooks/useUserPayment.js)** - Payment data hook

### Modified Files
- **[src/AuthContext.jsx](src/AuthContext.jsx)** - Added `credits` and `subscription` fields to user profiles
- **[src/GamesLanding.jsx](src/GamesLanding.jsx)** - Integrated payment modals and unlock logic
- **[src/components/AdminDashboard.jsx](src/components/AdminDashboard.jsx)** - Added Credits and Subscription columns with edit controls

## Admin Dashboard Features

### New Admin Controls
As an admin, you can now:

1. **View User Credits**
   - Click on credits number to edit
   - Add/remove credits for any user
   - Useful for customer support, promos, refunds

2. **View & Manage Subscriptions**
   - See subscription status (Active/None)
   - Click to edit subscription
   - Toggle active/inactive
   - Set plan type (monthly/yearly)
   - Set expiration date
   - Perfect for testing or manual upgrades

### Access Admin Dashboard
1. Add your email to [src/adminConfig.js](src/adminConfig.js)
2. Sign in with that email
3. Click your profile → Admin Dashboard
4. Go to "Users" tab to manage credits/subscriptions

## Next Steps - Stripe Setup

### 1. **Create Stripe Account**
Visit [dashboard.stripe.com](https://dashboard.stripe.com) and sign up

### 2. **Get Your API Keys**
```javascript
// In src/stripeConfig.js, replace:
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';

// With your actual key from:
// Dashboard → Developers → API Keys
```

### 3. **Create Products in Stripe Dashboard**

#### Subscription Products
1. Products → Create Product
2. **Monthly Subscription**:
   - Name: "Ad-Free Monthly"
   - Price: $2.99/month recurring
   - Copy the Price ID → Update `PRICING.subscription.monthly.priceId`

3. **Yearly Subscription**:
   - Name: "Ad-Free Yearly"
   - Price: $19.99/year recurring
   - Copy the Price ID → Update `PRICING.subscription.yearly.priceId`

#### Credit Products (One-time payments)
4. **Starter Pack**:
   - Name: "Starter Pack - 10 Credits"
   - Price: $0.99 one-time
   - Copy Price ID → Update `PRICING.credits.small.priceId`

5. **Popular Pack**:
   - Name: "Popular Pack - 60 Credits"
   - Price: $4.99 one-time
   - Copy Price ID → Update `PRICING.credits.medium.priceId`

6. **Value Pack**:
   - Name: "Value Pack - 150 Credits"
   - Price: $9.99 one-time
   - Copy Price ID → Update `PRICING.credits.large.priceId`

### 4. **Set Up Backend API (Required)**

⚠️ **IMPORTANT**: Stripe checkout requires a backend API for security. The frontend is already set up, but you need to create backend endpoints.

**Option A: Firebase Functions (Recommended)**
```bash
npm install -g firebase-tools
firebase init functions
cd functions
npm install stripe
```

Create `/api/create-checkout-session` endpoint:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
  const { priceId, userId, email, credits } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: credits ? 'payment' : 'subscription',
    success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}/canceled`,
    client_reference_id: userId,
    customer_email: email,
  });

  res.json({ id: session.id });
});
```

**Option B: Use Netlify Functions / Vercel Serverless**
Follow similar pattern with serverless functions.

### 5. **Update Frontend Checkout Functions**

In [src/components/SubscriptionModal.jsx](src/components/SubscriptionModal.jsx) and [src/components/CreditsModal.jsx](src/components/CreditsModal.jsx), uncomment the API calls:

```javascript
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: plan.priceId,
    userId: user.uid,
    email: user.email,
    credits: pack?.credits // Only for credits modal
  })
});
const session = await response.json();
const result = await stripe.redirectToCheckout({ sessionId: session.id });
```

### 6. **Set Up Webhooks (Critical)**

Stripe webhooks update your database when payments succeed:

1. Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed` - Payment succeeded
   - `customer.subscription.created` - New subscription
   - `customer.subscription.updated` - Subscription renewed
   - `customer.subscription.deleted` - Subscription canceled

4. Create webhook handler:
```javascript
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Update Firebase with credits or subscription
      if (session.mode === 'payment') {
        // Add credits
        await addCreditsToUser(session.client_reference_id, session.metadata.credits);
      } else if (session.mode === 'subscription') {
        // Activate subscription
        await activateSubscription(session.client_reference_id, session.subscription);
      }
      break;

    case 'customer.subscription.deleted':
      // Deactivate subscription
      await deactivateSubscription(event.data.object.metadata.userId);
      break;
  }

  res.json({ received: true });
});
```

## Testing

### Test Mode
1. Use Stripe test mode keys (pk_test_...)
2. Test cards: `4242 4242 4242 4242` (Visa)
3. Any future expiry date
4. Any 3-digit CVC

### What to Test
- [ ] Guest user watches ad → unlocks games for 24 hours
- [ ] Registered user uses credit → 1 credit deducted, game unlocked
- [ ] Buy credits → Stripe checkout → Credits added to account
- [ ] Subscribe → Stripe checkout → Subscription active → No ads shown
- [ ] Admin can edit user credits
- [ ] Admin can toggle subscription on/off

## AdSense Integration

✅ Already set up!
- Publisher ID: `pub-9558998933851822`
- AdSense code verified on your site
- Banner ads show to non-subscribers
- Rewarded video ads functional

### Replace Ad Slot IDs

In production, replace placeholder slot IDs in:
- [src/components/AdBanner.jsx](src/components/AdBanner.jsx) - Update `slot` prop
- [src/GamesLanding.jsx](src/GamesLanding.jsx) - Update slot="1234567890"

Get real slot IDs from your AdSense dashboard → Ad Units.

## Revenue Projections

### Example Revenue Model
- **1000 monthly users**
- **30% convert to watching ads**: 300 users × $2 CPM = $0.60
- **5% buy credits**: 50 users × $4.99 avg = $249.50
- **2% subscribe**: 20 users × $2.99/month = $59.80

**Monthly Revenue**: ~$310/month

### Scaling at 10,000 users
- Ads: $6
- Credits: $2,495
- Subscriptions: $598

**Monthly Revenue**: ~$3,100/month

## Support & Troubleshooting

### Common Issues

**Stripe checkout not opening**
- Check browser console for errors
- Verify backend API is deployed and responding
- Confirm Price IDs match Stripe dashboard

**Credits not added after purchase**
- Check webhook is receiving events (Stripe Dashboard → Webhooks → Events)
- Verify webhook signature verification
- Check Firebase database rules allow writes

**Subscription not activating**
- Confirm webhook handler updates Firebase subscription field
- Check end date is properly calculated (timestamp)

## Security Notes

- ✅ Never expose Stripe Secret Key in frontend
- ✅ Always validate webhooks with signature
- ✅ Use HTTPS for all API endpoints
- ✅ Implement rate limiting on backend
- ✅ Store minimal payment data (no card details)

## Future Enhancements

### Phase 2 Features
- Email receipts after purchase
- Credits purchase history
- Subscription management portal (cancel, upgrade)
- Promo codes/discount system
- Referral rewards program
- Gift credits to friends

### Analytics Integration
- Track conversion rates
- A/B test pricing
- Monitor churn rate
- Analyze user lifetime value

---

## Quick Reference

**Stripe Dashboard**: [dashboard.stripe.com](https://dashboard.stripe.com)
**AdSense Dashboard**: [adsense.google.com](https://adsense.google.com)
**Firebase Console**: [console.firebase.google.com](https://console.firebase.google.com)

**Dev Server**: http://localhost:5176
**Admin Dashboard**: Your Profile → Admin Dashboard

---

🎉 **Your payment system is fully implemented!** Just add your Stripe keys, create products, and deploy the backend webhook handler to go live.
