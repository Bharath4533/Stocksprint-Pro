# StockSprint Pro — Real-Time Indian Stock Trading & Investment Platform

**StockSprint Pro** is a modern, fintech-grade Indian trading and investment platform supporting real-time Indian equities (NSE/BSE) with live market feeds, Direct Mutual Funds, SIPs, IPOs, Multi-Folder Watchlists, Interactive Candlestick Charts, Paper Trading Engine with Order Book, Portfolio & Holdings Management, Supabase Cloud Database integration, and 12-Step KYC Onboarding.

Runs natively as a **Responsive Web App**, **Installable PWA (iOS / Android without APK)**, and **Flutter Mobile Client**.

---

## 🌟 Key Features

### 1. Live Indian Market Data Feeds & Discovery
- **NSE & BSE Equities**: Real-time quotes with live ticker synchronization across major Indian stocks (`RELIANCE.NS`, `TCS.NS`, `INFY.NS`, `HDFCBANK.NS`, `ICICIBANK.NS`, `SBIN.NS`, `ITC.NS`, `LT.NS`, `BHARTIARTL.NS`, `MARUTI.NS`, `TATAMOTORS.NS`, `ZOMATO.NS`, `SUZLON.NS`, `TRENT.NS`).
- **Benchmark Indices**: Live ticker for NIFTY 50 (`^NSEI`), SENSEX (`^BSESN`), BANK NIFTY (`^NSEBANK`), and NIFTY IT with continuous tick streams.
- **Global Search (`Cmd+K` / `Ctrl+K`)**: Instant search across Stocks, Mutual Funds, IPOs, and Indices.

### 2. Cloud Database with Supabase
- **PostgreSQL Database Schema**: `supabase_schema.sql` creates tables for users, securities, watchlists, orders, holdings, positions, funds, transactions, mutual funds, IPOs, alerts, and audit logs.
- **Dual-Mode Persistence**: Automatically syncs to Supabase Cloud when `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided in `.env`, with atomic local JSON storage fallback.

### 3. Interactive Charts & Technical Analysis
- **Custom HTML5 Canvas Chart Engine**: Candlestick and Line chart views.
- **Multi-Timeframe Analysis**: `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `5Y`.
- **Technical Overlays**: Volume histogram and SMA (20) indicator.
- **Crosshair Tooltip**: Floating real-time OHLCV inspection on touch and mouse movements.

### 4. Paper Trading & Execution Engine
- **Order Types**: Market, Limit, Stop Loss (SL), Stop Loss Market (SL-M).
- **Product Types**: Cash & Carry (CNC Delivery) and Margin Intraday Square-off (MIS 5x leverage).
- **Transparent Charges Calculator**: Accurate statutory breakdown (STT, Exchange turnover, SEBI fees, GST, Stamp duty, DP charges).
- **Order Book**: Live tracking of Open, Executed, and Cancelled orders.
- **Positions & Holdings**: Separate Delivery holdings and Intraday positions with 1-click square-off.

### 5. Direct Mutual Funds & SIP Simulator
- **Mutual Fund Discovery**: Categories covering Flexi Cap, Small Cap, Large Cap, Hybrid & Index funds.
- **SIP Compound Calculator**: Real-time projection model visualizing wealth gain over 1 to 30 years.
- **Automated Simulated SIPs**: Monthly debit simulation directly from trading balance.

### 6. Primary Market IPO Hub
- **IPO Discovery**: Open, Upcoming, and Recently Listed IPOs.
- **Issue Details**: Price Band, Lot Size, Issue Size, Key Dates, and GMP (Grey Market Premium).
- **Simulated ASBA Mandate**: 1-click IPO application via simulated UPI ID.

---

## 🚀 Cloud Deployment on OnRender (`onrender.com`)

To deploy live and share a public URL (e.g. `https://stocksprint-pro.onrender.com`) with general users:

1. **Push your repository to GitHub**:
   ```bash
   git push origin main
   ```
2. **Go to Render Dashboard** ([https://dashboard.render.com](https://dashboard.render.com)):
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository `Bharath4533/Stocksprint-Pro`.
   - Select **Node** environment.
   - Build Command: `npm install`
   - Start Command: `npm start`
3. **Add Environment Variables (Optional for Supabase)**:
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY`: `your-anon-key`
   - `JWT_SECRET`: `your-random-secret`
4. Click **Deploy Web Service**.
   Render will provide your live URL: **`https://stocksprint-pro.onrender.com`**.

---

## 📱 Running on iOS & Android (PWA — No APK Needed)

StockSprint Pro is fully PWA-enabled with a Web App Manifest and Service Worker:

- **iOS (iPhone / iPad)**:
  1. Open the live URL in Safari.
  2. Tap the **Share** button (box with upward arrow).
  3. Select **"Add to Home Screen"**.
  4. The app runs as a full-screen, standalone native-like iOS app.
- **Android**:
  1. Open the live URL in Chrome.
  2. Tap the menu (three dots) -> **"Install app"** or **"Add to Home screen"**.

---

## 🛠️ Local Development

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

## 📲 Flutter Mobile Client (`flutter_app/`)

To run the Flutter app on iOS Simulator, Android Emulator, or Web:
```bash
cd flutter_app
flutter pub get
flutter run
```
