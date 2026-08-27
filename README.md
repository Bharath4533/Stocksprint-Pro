# NexTrade Pro — Complete Indian Stock Trading & Investment Platform

**NexTrade Pro** is a modern, high-performance, fintech-grade Indian trading and investment platform supporting real-time Indian equities (NSE/BSE), Mutual Funds, SIPs, IPOs, Multi-Folder Watchlists, Interactive Candlestick Charts, Paper Trading Engine with Order Book, Portfolio & Holdings Management, and 12-Step KYC Onboarding.

---

## 🌟 Key Features

### 1. Market Discovery & Securities Master
- **NSE & BSE Equities**: Real-time quotes across major Indian scrips (RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, ITC, LT, BHARTIARTL, MARUTI, TATAMOTORS, ZOMATO, SUZLON, TRENT).
- **Benchmark Indices**: Live ticker for NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT, NIFTY AUTO, and NIFTY MIDCAP 100 with Brownian motion price simulation.
- **Global Search (`Cmd+K` / `Ctrl+K`)**: Instant search across Stocks, Mutual Funds, IPOs, and Indices with keyboard navigation.

### 2. Interactive Charts & Technical Analysis
- **Custom HTML5 Canvas Chart Engine**: Candlestick and Line chart views.
- **Multi-Timeframe Analysis**: `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `5Y`.
- **Technical Overlays**: Volume histogram and SMA (20) indicator.
- **Crosshair Tooltip**: Floating real-time OHLCV inspection on mouse & touch movements.

### 3. Paper Trading & Execution Engine
- **Order Types**: Market, Limit, Stop Loss (SL), Stop Loss Market (SL-M).
- **Product Types**: Cash & Carry (CNC Delivery) and Margin Intraday Square-off (MIS 5x leverage).
- **Transparent Charges Calculator**: Accurate statutory breakdown (STT, Exchange turnover, SEBI fees, GST, Stamp duty, DP charges).
- **Order Book**: Live tracking of Open, Executed, and Cancelled orders.
- **Positions & Holdings**: Separate Delivery holdings and Intraday positions with 1-click square-off.

### 4. Direct Mutual Funds & SIP Simulator
- **Mutual Fund Discovery**: Categories covering Flexi Cap, Small Cap, Large Cap, Hybrid & Index funds.
- **SIP Compound Calculator**: Real-time projection model visualizing wealth gain over 1 to 30 years.
- **Automated Simulated SIPs**: Monthly debit simulation directly from trading balance.

### 5. Primary Market IPO Hub
- **IPO Discovery**: Open, Upcoming, and Recently Listed IPOs.
- **Issue Details**: Price Band, Lot Size, Issue Size, Key Dates, and GMP (Grey Market Premium).
- **Simulated ASBA Mandate**: 1-click IPO application via simulated UPI ID.

### 6. Funds, Ledger & Compliance
- **Simulated Deposits & Withdrawals**: Instant fund additions via simulated UPI and Netbanking.
- **Transaction Ledger**: Complete debit/credit audit trail with reference IDs.
- **12-Step KYC Wizard**: Simulated PAN verification, Bank account penny drop verification, Nominee declaration, and DigiLocker approval.
- **Regulatory Disclosures**: Mandatory SEBI risk warnings and brokerage tariff schedule.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Node.js, Express.js (REST API, SSE EventStream for live ticks, RBAC middleware, atomic JSON database layer).
- **Frontend**: Vanilla JavaScript (ES6+ modular views and components), Vanilla CSS Design System with CSS variables (Dark/Light mode), and HTML5 Canvas Charting.
- **Zero Heavy Build Step**: Starts immediately with `npm start` on Node.js without Webpack or complex compilation.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Application Server
```bash
npm start
```
The app will be live at `http://localhost:3000`.

### 3. Run Automated Tests
```bash
npm test
```

---

## 🔑 Default Accounts (Demo & Admin)

| Account | Email | Role | Features |
|---|---|---|---|
| **Demo User** | `demo@nextrade.in` | `USER` | ₹5,00,000 Simulated Capital, Sample Holdings, Watchlists |
| **System Admin** | `admin@nextrade.in` | `ADMIN` | Full System Metrics, User Directory, Securities Editor, Broadcast |

---

## 📡 REST API Summary

- `POST /api/auth/demo` — 1-click instant demo login.
- `GET /api/markets/indices` — Live benchmark indices.
- `GET /api/markets/search?q=...` — Unified global search.
- `GET /api/stocks/:symbol` — Stock details, fundamentals, financials.
- `GET /api/stocks/:symbol/chart?range=1D` — Historical OHLCV candles.
- `POST /api/orders` — Place simulated trading order.
- `GET /api/portfolio` — Portfolio summary, holdings, and open positions.
- `POST /api/funds/deposit` — Deposit simulated funds.
- `POST /api/mutual-funds/sips` — Start simulated monthly SIP.
- `POST /api/ipos/:id/apply` — Apply for IPO with simulated UPI mandate.
- `GET /api/stream/ticks` — Server-Sent Events real-time price stream.
