# Feature Roadmap

Planned features and enhancements for future releases.

---

## Priority 1 — High Value, Small-Medium Effort

### Auto-Sell on External Buys
PumpPortal watches trades in real-time. When external buy volume exceeds a threshold, auto-sells from our wallets.

- Service that subscribes to PumpPortal WebSocket for the launched token
- Configurable sell triggers (external volume threshold, percentage to sell)
- Per-wallet or per-group sell execution
- MEV protection delay before selling

---

### Staged Rapid Sell
Instead of selling everything at once, sell in stages tied to volume thresholds (e.g. sell 33% at 2 SOL external volume, 66% at 5 SOL, 100% at 10 SOL).

- Extend existing rapid-sell endpoint with `mode: "staged"` option
- Stage configuration (volume threshold + sell percentage per stage)
- UI controls for setting stages

---

### Market Cap Auto-Sell
Poll market cap from Jupiter/Birdeye/pump.fun. Auto-sell when target market cap is reached.

- Market cap polling service (Jupiter price API)
- Configurable sell threshold
- Trigger rapid-sell when threshold hit

---

## Priority 2 — Medium Value, Medium Effort

### Volume Maker
Buy/sell on your own token with random intervals and amounts to create organic-looking volume.

- Volume maker service that takes a mint, duration, and amount range
- Uses existing buy/sell infrastructure
- API endpoint + UI toggle
- Random timing between trades

---

### Persistent PnL Tracker
Per-run PnL tracking with history. Records SOL spent (funding, fees) and SOL recovered (sells, gather, fee collection).

- Track total SOL in vs SOL out per launch
- Persistent storage in `data/pnl-history.json`
- Summary component in Trading page with history table

---

### MEV Protection / Front-Run Detection
Before holder wallet auto-buys, check if someone front-ran the launch by monitoring external buy volume. If suspicious activity detected, delay or skip holder buys.

- After launch succeeds, before holder auto-buys, check bonding curve for unexpected volume
- If external buys exceed threshold, warn and delay holder buys
- Configurable threshold and delay

---

## Priority 3 — Nice to Have, Larger Effort

### Wallet Warming
Warm wallets with real trades on trending pump.fun tokens before using them for launches. Makes wallets look organic on-chain.

- Fetch trending tokens from pump.fun
- Buy small amounts on trending tokens from wallet
- Sell after short delay to recover SOL
- Track warming status per wallet
- Dedicated UI page for managing warming

---

### Intermediary Funding (Privacy)
Fund wallets through intermediary hops to break the on-chain connection between funding wallet and launch wallets.

- Optional intermediary hop system for wallet funding
- Fresh intermediary wallets per transfer
- Recovery mechanism for stuck funds

---

### AI Image Generation
Generate token images using Gemini API with style presets (meme, professional, cartoon, abstract).

- Gemini API integration
- Style presets
- UI button on launch page

---

### Relaunch with Same Wallets
After a failed or completed launch, reuse the same funded wallets for a new token without re-funding.

- "Relaunch" button that keeps existing wallets but generates new mint
- Skip funding step if wallets already have SOL

---

## Already Implemented

- Token creation (V2 SDK)
- Jito bundles with RPC fallback
- Holder wallets with auto-buy
- Vanity address generation
- Address Lookup Tables
- Creator fee collection
- Gather / sweep SOL
- Live trades via PumpPortal
- Encrypted wallet storage (AES-256-CBC)
- Launch history
- SSE progress streaming
- Rapid sell (percentage-based, per-group)
- External links (pump.fun, GMGN, Solscan, Birdeye, DexScreener)
