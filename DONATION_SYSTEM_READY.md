# Donation System - Ready to Test!

**URL**: http://localhost:3003/donate  
**Status**: UI Complete, API Ready  
**Date**: October 16, 2025

---

## ✅ What's Built

### 4-Portfolio Donation System

**Simplified Approach**: Individual donations instead of split sliders

#### Portfolio 1: Wave Reader Development 👨‍💻
- **Earns Tokens**: YES ($1 = 1 token)
- **Purpose**: Support development
- **Highlighted**: Special gradient card
- **Ghost**: Shows 👻 if $0

#### Portfolio 2: W3C WAI ♿
- **Earns Tokens**: NO (charity only)
- **Purpose**: Web accessibility
- **Payment**: Via PayPal Giving Fund or TheGivingBlock

#### Portfolio 3: ASPCA 🐕
- **Earns Tokens**: NO (charity only)
- **Purpose**: Animal welfare
- **Payment**: Via PayPal Giving Fund or TheGivingBlock

#### Portfolio 4: Audubon Society 🦅
- **Earns Tokens**: NO (charity only)
- **Purpose**: Bird conservation
- **Payment**: Via PayPal Giving Fund or TheGivingBlock

---

## 🎨 UI Features

### Per Portfolio
- Amount input field
- Quick amounts: $5, $10, $25, $50
- Live token calculation (developer only)
- Individual donate button
- Ghost indicator if 0 tokens

### Total Section
- Total tokens displayed (sum of dev donations)
- "Complete All Donations" button
- Ghost indicator if total = 0 tokens
- Clear messaging: "Only developer donations earn tokens"

---

## 💰 Token Calculation Logic

```javascript
// CORRECT: Only developer donations earn tokens
Developer: $100 → 100 tokens ✅
W3C WAI: $50 → 0 tokens (charity support)
ASPCA: $25 → 0 tokens (charity support)
Audubon: $25 → 0 tokens (charity support)
---
Total: $200 donated, 100 tokens earned
```

**Ghost Shows When**:
- Developer donation = $0 (even if charities have donations)
- Total tokens = 0 (all money to charity)

---

## 🔌 API Endpoints

### Single Donation
```bash
POST /api/donate
{
  "portfolio": "developer",  # or w3c_wai, aspca, audubon
  "amount": 100,
  "userId": 123
}

Response:
{
  "success": true,
  "portfolio": "developer",
  "amount": 100,
  "tokensGranted": 100,
  "message": "Thank you! 100 tokens granted"
}
```

### Batch Donations
```bash
POST /api/donate/batch
{
  "userId": 123,
  "donations": [
    { "portfolio": "developer", "amount": 50 },
    { "portfolio": "w3c_wai", "amount": 25 },
    { "portfolio": "aspca", "amount": 25 }
  ]
}

Response:
{
  "success": true,
  "donations": [...],
  "totalTokens": 50,
  "message": "Thank you for donating! 50 tokens granted"
}
```

### Stats
```bash
GET /api/donate/stats

Response:
{
  "success": true,
  "stats": {
    "developer": { "total": 1000, "count": 25 },
    "w3c_wai": { "total": 500, "count": 15 },
    "aspca": { "total": 300, "count": 10 },
    "audubon": { "total": 200, "count": 8 }
  }
}
```

---

## 🧪 Test It Now

1. **Visit**: http://localhost:3003/donate

2. **Try**:
   - Enter $100 in Developer → See 100 tokens
   - Clear developer, enter $50 in W3C → See 👻 ghost
   - Enter $25 in each → See 25 tokens total
   - Click quick amount buttons ($5, $10, etc.)
   - Click individual donate buttons
   - Click "Complete All Donations" button

3. **Expected Behavior**:
   - Only developer donations show tokens
   - Ghost appears when 0 tokens
   - Buttons disabled when amount = $0
   - Alerts confirm donations (mocked for now)
   - Forms reset after donation

---

## 🔄 Database Schema

```sql
CREATE TABLE charity_donations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    portfolio VARCHAR(50) CHECK (portfolio IN ('developer', 'w3c_wai', 'aspca', 'audubon')),
    amount DECIMAL(10,2) NOT NULL,
    tokens_granted INTEGER DEFAULT 0,
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Future Integration (Phase 4)

### Developer Donations
**Payment**: Phantom Wallet (Solana)
```javascript
const signature = await phantom.sendTransaction({
  to: devWallet,
  amount: donationAmount
});

await grantTokens(userId, Math.floor(donationAmount));
```

### Charity Donations
**Payment**: PayPal Giving Fund or TheGivingBlock
```javascript
// Option 1: PayPal Giving Fund (free, trusted)
await paypalGiving.donate({
  charity: 'W3C WAI',
  amount: amount
});

// Option 2: TheGivingBlock (crypto-native)
await theGivingBlock.donate({
  charity: 'ASPCA',
  amount: amount,
  currency: 'SOL'
});
```

---

## ✅ What Works

- [x] Beautiful 4-portfolio UI
- [x] Live token calculation
- [x] Ghost indicator (👻)
- [x] Quick amount buttons
- [x] Individual donate buttons
- [x] Batch donate button
- [x] API endpoints (mocked)
- [x] Database schema updated
- [x] Proper token logic (dev only)

---

## 🎯 Next Steps

**Immediate**:
- Add link to /donate from main pages
- Add user authentication check
- Track donations in localStorage (before DB)

**Phase 4**:
- Phantom wallet integration
- PayPal Giving Fund setup
- Real payment processing
- Token granting automation

---

**Status**: ✅ Complete and Ready to Test!  
**Try it**: http://localhost:3003/donate

