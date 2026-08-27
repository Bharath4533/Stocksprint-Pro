# NexTrade Pro — Flutter Mobile & Cross-Platform Client

**NexTrade Pro** Flutter client is a production-grade Indian trading and investment app built with Flutter and Dart, interfacing seamlessly with the Node.js backend.

---

## 📱 Features
- **Markets & Indices**: Live ticker for NIFTY 50, SENSEX, BANK NIFTY with real-time Brownian drift.
- **Custom Canvas Charts**: Interactive Candlestick & Line stock charts with touch crosshair and volume bars.
- **Paper Trading Engine**: Order ticket with Delivery (CNC) vs Intraday (MIS 5x), Market/Limit/SL, and statutory STT/GST breakdown.
- **Portfolio & Holdings**: Mark-to-market valuation, unrealized & realized P&L, 1-click square-off.
- **Direct Mutual Funds & SIP**: Fund listings with interactive compounding wealth growth projection simulator.
- **IPO Hub**: Live Indian IPO issue tracker with 1-click simulated UPI ASBA bidding.
- **12-Step KYC Wizard**: Mobile Stepper onboarding with DigiLocker and PAN verification.
- **Adaptive Dark & Light Theme**: Built-in fintech color tokens and HSL palettes.

---

## 🚀 How to Run

### 1. Ensure Backend Server is Running
From the repository root:
```bash
npm start
```
(Server starts on `http://localhost:3000`)

### 2. Configure Backend Host in Flutter (if needed)
Open `lib/config/api_config.dart`:
- **iOS Simulator / macOS / Web**: `http://localhost:3000/api`
- **Android Emulator**: `http://10.0.2.2:3000/api`
- **Physical Device**: `http://<your-local-ip>:3000/api`

### 3. Run Flutter App
```bash
cd flutter_app
flutter pub get
flutter run
```
