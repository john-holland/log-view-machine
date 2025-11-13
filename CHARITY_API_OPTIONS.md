# Charity Donation API Options

**Date**: October 16, 2025  
**Purpose**: Evaluate charity donation APIs for Wave Reader platform

---

## Updated Donation Model

**New Approach**: 4 separate donation portfolios instead of slider splits

### Portfolio Options
1. **Wave Reader Development** (Developer) - Earns tokens
2. **W3C WAI** - Charity only, no tokens
3. **ASPCA** - Charity only, no tokens
4. **Audubon Society** - Charity only, no tokens

### Token Calculation
```
Tokens Earned = Developer Donation Amount ($1 = 1 token)
```

**Examples**:
- $100 to developer → 100 tokens 🎉
- $50 to W3C WAI → 0 tokens (charity support)
- $25 to each (total $100) → 25 tokens + charity support
- $0 to developer → 👻 ghost indicator

---

## API Options Comparison

### 1. TheGivingBlock API

**Overview**: Crypto-native charity donation platform

**Pros**:
- ✅ Crypto-first (perfect for Solana integration)
- ✅ 1000+ nonprofits including major orgs
- ✅ Direct crypto donations (no conversion needed)
- ✅ Tax receipts automated
- ✅ Transparent blockchain tracking
- ✅ API for donation verification

**Cons**:
- ❌ Enterprise pricing (may be expensive)
- ❌ Needs verification that W3C WAI, ASPCA, Audubon are on platform
- ❌ Requires crypto infrastructure

**Integration Complexity**: Medium

**Best For**: Solana-native token economy

**API Endpoints**:
```
POST /donate
GET /charities
GET /donation/:id
```

---

### 2. GivePact API

**Overview**: Developer-friendly charity donation platform

**Pros**:
- ✅ Fiat donations (USD, no crypto needed)
- ✅ Developer-friendly API
- ✅ Flexible split handling
- ✅ Social impact tracking
- ✅ Lower barrier to entry for users

**Cons**:
- ❌ Smaller nonprofit network
- ❌ May not have all 3 target charities
- ❌ Newer platform (less established)
- ❌ Fiat-crypto conversion needed for tokens

**Integration Complexity**: Low-Medium

**Best For**: Traditional payment flows

---

### 3. Hybrid Approach (Recommended)

**Strategy**: Use best tool for each purpose

**Developer Donations** (Tokens):
- Use Solana directly
- Phantom wallet connection
- Instant token credits
- No middleman fees

**Charity Donations**:
- **Option A**: TheGivingBlock (if charities available)
- **Option B**: Direct charity payment processors
  - W3C WAI: Direct donation via W3C
  - ASPCA: ASPCA donation API
  - Audubon: Audubon donation portal
- **Option C**: Use PayPal Giving Fund (covers all 3)

**Benefits**:
- ✅ Direct Solana for developer = instant tokens
- ✅ Established charity processors = trust
- ✅ No conversion losses
- ✅ Tax receipts from actual charities

---

### 4. Humble Bundle Widget (Premium Content)

**For**: Premium mod bundles

**Features**:
- Charity slider (Humble, Developer, Charity)
- Pay-what-you-want model
- Proven conversion rates
- Built-in payment processing

**Integration**:
```html
<script src="https://www.humblebundle.com/widget/key/YOUR_KEY"></script>
```

**Use Case**: Bundle popular mods together, users choose price split

**Revenue Share**: ~75% developer, ~25% Humble/charity (configurable)

---

## Recommendation

### Phase 1-2: Simple Approach
```
Developer Donations → Phantom Wallet → Solana tokens
Charity Donations → PayPal Giving Fund → All 3 charities supported
```

### Phase 3+: Enhanced
```
Developer → Solana (direct)
W3C WAI → W3C direct donation
ASPCA → TheGivingBlock or ASPCA API
Audubon → TheGivingBlock or Audubon portal
Premium Bundles → Humble Bundle widget
```

---

## Implementation Plan

### Immediate (Works Today)
1. Build donation UI with 4 portfolios
2. Mock the payments
3. Calculate tokens correctly (dev only)
4. Show 👻 when appropriate

### Phase 4 (Actual Integration)
1. Integrate Phantom wallet for developer donations
2. Connect PayPal Giving Fund for charities
3. Verify charities on TheGivingBlock
4. Add tax receipt generation

### Future (Premium Bundles)
1. Apply for Humble Bundle partnership
2. Create mod bundles
3. Integrate widget
4. Revenue share with charity

---

## Token Economy Integration

### With TheGivingBlock
```javascript
// User donates via Solana to developer
const devDonation = await phantomWallet.sendTransaction(amount, devWallet);
grantTokens(userId, amount); // Instant

// User donates to charity via TheGivingBlock
await theGivingBlock.donate({
  charity: 'ASPCA',
  amount: amount,
  currency: 'SOL' // or USD with conversion
});
// No tokens awarded, but tracked for user profile
```

### With PayPal Giving Fund
```javascript
// Developer donation (Solana)
const devDonation = await solanaService.transfer(amount);
grantTokens(userId, amount);

// Charity donation (PayPal)
const charityDonation = await paypalGiving.donate({
  charity: 'W3C WAI',
  amount: amount,
  currency: 'USD'
});
// No tokens, but shows on user profile
```

---

## Recommendation: Start Simple, Scale Smart

**MVP (Phase 1-2)**:
- Developer: Mock with manual token grants
- Charities: External links to charity websites
- Track "intended donations" in database
- Focus on UX and token calculation

**Production (Phase 4)**:
- Developer: Solana Phantom wallet
- Charities: PayPal Giving Fund (covers all 3)
- Full API integration
- Automated tax receipts

**Premium (Phase 5+)**:
- Humble Bundle for mod bundles
- TheGivingBlock for crypto charity option
- Multi-currency support
- Charity verification badges

---

## Cost Analysis

**TheGivingBlock**: Enterprise pricing (contact for quote)  
**GivePact**: Free for nonprofits, small fee for platforms  
**PayPal Giving Fund**: Free, 100% goes to charity  
**Humble Bundle**: Revenue share (~25%)  
**Solana**: Network fees only (~$0.00025/transaction)  

**Winner for MVP**: PayPal Giving Fund (free, trusted, all charities) + Solana (developer)

---

## Next Steps

1. Build donation UI with 4 portfolios
2. Implement token calculation (dev only)
3. Add 👻 ghost indicator logic
4. Create `/api/donate` endpoint (mocked)
5. Test UX thoroughly
6. Phase 4: Add real payment integration

---

**Status**: Recommendation Ready  
**Choice**: Simple start, scale with real APIs in Phase 4

