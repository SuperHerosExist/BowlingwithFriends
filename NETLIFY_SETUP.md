# Netlify Deployment Setup

## Environment Variables Configuration

To deploy this app on Netlify, you need to configure the following environment variables in your Netlify dashboard:

### Firebase Configuration
Go to **Site settings > Environment variables** and add:

```
VITE_FIREBASE_API_KEY=AIzaSyBplm3Xt3Mru_Sxi2g3uptgbzXbQ8KZ0Aw
VITE_FIREBASE_AUTH_DOMAIN=bowling-fun.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://bowling-fun-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=bowling-fun
VITE_FIREBASE_STORAGE_BUCKET=bowling-fun.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1041099466681
VITE_FIREBASE_APP_ID=1:1041099466681:web:55553970cd19f150dc3868
```

### Stripe Configuration (if using Stripe features)
```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Important Note

Firebase API keys are **safe to expose publicly** in client-side code. They identify your Firebase project but don't grant access - Firebase Security Rules control access. However, Netlify's scanner flags them as secrets, so we use environment variables to satisfy the scanner.

## Steps

1. Add all environment variables to Netlify Site Settings
2. Push code changes to trigger new build
3. Netlify will build with environment variables and pass the secret scanner
