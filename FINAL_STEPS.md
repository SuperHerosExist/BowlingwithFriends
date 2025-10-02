# 🎉 Final Steps to Launch Stripe Payments

Your Stripe payment system is **95% complete**! Just 2 quick steps to go live:

---

## Step 1: Add Environment Variables to Netlify (5 minutes)

Netlify will automatically deploy when you push to git. We need to add your Stripe secret keys:

### Instructions:

1. **Go to your Netlify dashboard**: https://app.netlify.com
2. **Select your site**: "BowlingwithFriends" or "bowlingfun"
3. **Navigate to**: Site settings → Environment variables
4. **Add these 2 variables**:

```
STRIPE_SECRET_KEY = sk_live_YOUR_SECRET_KEY_HERE

STRIPE_WEBHOOK_SECRET = whsec_YOUR_WEBHOOK_SECRET_HERE
```

**Note**: Use the Stripe secret key I provided you earlier (starts with `sk_live_51SDsYb...`)

5. **Click "Save"**
6. **Trigger a new deploy** (or it will auto-deploy from your git push)

---

## Step 2: Set Up Stripe Webhook (5 minutes)

Webhooks tell your app when payments succeed so credits/subscriptions activate automatically.

### Instructions:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Click "+ Add endpoint"**
3. **Enter endpoint URL**: `https://bowlingfun.netlify.app/.netlify/functions/stripe-webhook`
4. **Select events to listen to**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. **Click "Add endpoint"**
6. **Reveal webhook signing secret** (starts with `whsec_`)
7. **Copy the webhook secret**
8. **Go back to Netlify** → Environment variables
9. **Add/update** `STRIPE_WEBHOOK_SECRET` with the webhook secret you just copied
10. **Redeploy** your Netlify site to pick up the new variable

---

## ✅ That's It! Your Payment System is LIVE!

### What Works Now:

#### **For Guest Users:**
- ✅ Play "Makes or Misses" free
- ✅ Watch 30-second rewarded video ad to unlock all games for 24 hours
- ✅ See banner ads on landing page

#### **For Registered Users:**
- ✅ **Option 1**: Use 1 credit to unlock a game (no ads)
- ✅ **Option 2**: Watch ad for 24-hour unlock
- ✅ **Option 3**: Buy credits ($0.99-$9.99)
- ✅ **Option 4**: Subscribe ($2.99/mo or $19.99/yr)

#### **For Subscribers:**
- ✅ Unlimited access to ALL games
- ✅ NO ads anywhere
- ✅ Stats tracking
- ✅ Priority support

---

## Admin Dashboard Features

You can now manage everything from your Admin Dashboard:

### How to Access:
1. Sign in with your admin email
2. Click your profile (top right)
3. Select **"Admin Dashboard"**
4. Go to **"Users"** tab

### What You Can Do:
- 💰 **Edit Credits**: Click any credit balance → Change amount → Save
- 👑 **Manage Subscriptions**: Click subscription status → Toggle on/off → Set expiry → Save
- 📊 **View Stats**: See all user payments and game activity
- 🎮 **Monitor Games**: Track active games across all modes

---

## Testing the Payment Flow

### Test a Credit Purchase:
1. Sign in (not as guest)
2. Click a premium game (Match Play, King of the Hill, etc.)
3. In the unlock modal, click **"Buy Credits"**
4. Select a pack → Click purchase
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout → You'll be redirected back
7. Credits should appear in your account within 5 seconds
8. Try unlocking a game with your new credits!

### Test a Subscription:
1. Click **"Go Ad-Free"** button
2. Choose Monthly or Yearly
3. Click Subscribe
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Your subscription activates immediately
7. All games unlock, no ads shown!

---

## Stripe Products Already Created ✅

These are already set up in your Stripe account:

| Product | Price | Price ID |
|---------|-------|----------|
| **Monthly Subscription** | $2.99/mo | `price_1SDtWbAFCuklL7z9RLWbjP6P` |
| **Yearly Subscription** | $19.99/yr | `price_1SDtWbAFCuklL7z9drqnyJfm` |
| **Starter Pack** | $0.99 | `price_1SDtWcAFCuklL7z9zKEVLQpB` |
| **Popular Pack** | $4.99 | `price_1SDtWcAFCuklL7z9XTpzLgk4` |
| **Value Pack** | $9.99 | `price_1SDtWdAFCuklL7z9B4ogxHgi` |

---

## Revenue Tracking

### Where to Monitor Revenue:
- **Stripe Dashboard**: https://dashboard.stripe.com
  - See payments, subscriptions, customers
  - Export data for accounting
  - View refunds and disputes

- **Admin Dashboard** (your app):
  - See who's subscribed
  - Track credit purchases
  - Monitor user engagement

---

## Troubleshooting

### "Payment not processing"
- ✅ Check Netlify environment variables are set
- ✅ Verify webhook is active in Stripe dashboard
- ✅ Check Netlify function logs for errors

### "Credits not added after purchase"
- ✅ Go to Stripe Dashboard → Webhooks → Check recent events
- ✅ Click on failed event to see error details
- ✅ Most common issue: `STRIPE_WEBHOOK_SECRET` not set correctly

### "Subscription shows as inactive"
- ✅ Check webhook received `checkout.session.completed` event
- ✅ Verify user's subscription field in Firebase database
- ✅ Use Admin Dashboard to manually activate if needed

---

## Go Live Checklist

Before announcing to users:

- [ ] Add Netlify environment variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Set up Stripe webhook endpoint
- [ ] Test credit purchase with real card
- [ ] Test subscription with real card
- [ ] Verify credits show up in Admin Dashboard
- [ ] Verify subscription activates and removes ads
- [ ] Test canceling a subscription
- [ ] Set up Stripe email receipts (optional)
- [ ] Review Stripe payment settings (refund policy, etc.)

---

## 🎊 You're Ready to Make Money!

Your bowling games app now has:
- ✅ **3 revenue streams**: Ads, Credits, Subscriptions
- ✅ **Professional checkout**: Powered by Stripe
- ✅ **Auto-fulfillment**: Webhooks handle everything
- ✅ **Admin controls**: Manage users and payments
- ✅ **Scalable**: Handles unlimited transactions

**Total setup time**: ~15 minutes (just the 2 steps above!)

---

## Support Resources

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Documentation**: https://stripe.com/docs
- **Netlify Dashboard**: https://app.netlify.com
- **Your Admin Dashboard**: https://bowlingfun.netlify.app (sign in → Admin Dashboard)

**Questions?** Check [STRIPE_SETUP.md](STRIPE_SETUP.md) for detailed technical documentation.

---

🚀 **Deploy, test, and start earning!**
