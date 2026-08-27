-- ============================================================================
-- StockSprint Pro — Supabase Database Schema
-- Run this script in your Supabase SQL Editor (https://app.supabase.com)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(md5(random()::text), 1, 10)),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
    kyc_status TEXT DEFAULT 'VERIFIED' CHECK (kyc_status IN ('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED')),
    is_demo BOOLEAN DEFAULT FALSE,
    phone TEXT,
    pan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Securities Master (NSE/BSE Indian Equities & Indices)
CREATE TABLE IF NOT EXISTS securities (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    exchange TEXT DEFAULT 'NSE' CHECK (exchange IN ('NSE', 'BSE', 'MCX')),
    sector TEXT,
    cap TEXT,
    price NUMERIC(12, 2) NOT NULL,
    prev_close NUMERIC(12, 2) NOT NULL,
    open NUMERIC(12, 2),
    high NUMERIC(12, 2),
    low NUMERIC(12, 2),
    close NUMERIC(12, 2),
    change NUMERIC(10, 2) DEFAULT 0.00,
    percent_change NUMERIC(6, 2) DEFAULT 0.00,
    volume BIGINT DEFAULT 0,
    value NUMERIC(18, 2) DEFAULT 0.00,
    market_cap NUMERIC(18, 2) DEFAULT 0.00,
    fundamentals JSONB DEFAULT '{}'::jsonb,
    financials JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Benchmark Indices
CREATE TABLE IF NOT EXISTS indices (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    value NUMERIC(12, 2) NOT NULL,
    prev_close NUMERIC(12, 2) NOT NULL,
    open NUMERIC(12, 2),
    high NUMERIC(12, 2),
    low NUMERIC(12, 2),
    change NUMERIC(10, 2) DEFAULT 0.00,
    percent_change NUMERIC(6, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
    id TEXT PRIMARY KEY DEFAULT ('wl_' || substr(md5(random()::text), 1, 10)),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    symbols TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Funds & Margin
CREATE TABLE IF NOT EXISTS funds (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    available_cash NUMERIC(14, 2) DEFAULT 500000.00,
    used_margin NUMERIC(14, 2) DEFAULT 0.00,
    total_simulated_capital NUMERIC(14, 2) DEFAULT 500000.00,
    withdrawable_amount NUMERIC(14, 2) DEFAULT 500000.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT ('ord_' || substr(md5(random()::text), 1, 10)),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL REFERENCES securities(symbol),
    exchange TEXT DEFAULT 'NSE',
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    order_type TEXT NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'SL', 'SL_M')),
    product_type TEXT NOT NULL CHECK (product_type IN ('CNC', 'MIS')),
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(12, 2) NOT NULL,
    trigger_price NUMERIC(12, 2) DEFAULT 0.00,
    charges NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'FILLED' CHECK (status IN ('OPEN', 'FILLED', 'REJECTED', 'CANCELLED')),
    charges_breakdown JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Delivery Holdings (CNC)
CREATE TABLE IF NOT EXISTS holdings (
    id TEXT PRIMARY KEY DEFAULT ('hld_' || substr(md5(random()::text), 1, 10)),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL REFERENCES securities(symbol),
    company_name TEXT,
    quantity INT NOT NULL CHECK (quantity >= 0),
    average_buy_price NUMERIC(12, 2) NOT NULL,
    invested_value NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- 8. Intraday Positions (MIS)
CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY DEFAULT ('pos_' || substr(md5(random()::text), 1, 10)),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL REFERENCES securities(symbol),
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity INT NOT NULL,
    average_price NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    realized_pnl NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Transaction Ledger
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT ('txn_' || substr(md5(random()::text), 1, 10)),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'BUY_TRADE', 'SELL_TRADE', 'SIP_INSTALLMENT', 'CHARGES')),
    amount NUMERIC(14, 2) NOT NULL,
    payment_method TEXT,
    reference_id TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Mutual Funds Master
CREATE TABLE IF NOT EXISTS mutual_funds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    nav NUMERIC(10, 2) NOT NULL,
    returns_1y TEXT,
    returns_3y TEXT,
    returns_5y TEXT,
    aum TEXT,
    expense_ratio TEXT,
    min_sip_amount NUMERIC(10, 2) DEFAULT 500.00,
    top_holdings TEXT[] DEFAULT ARRAY[]::TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Mutual Fund SIPs
CREATE TABLE IF NOT EXISTS sips (
    id TEXT PRIMARY KEY DEFAULT ('sip_' || substr(md5(random()::text), 1, 10)),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    fund_id TEXT REFERENCES mutual_funds(id),
    amount NUMERIC(10, 2) NOT NULL,
    sip_date INT DEFAULT 10,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. IPO Master & Applications
CREATE TABLE IF NOT EXISTS ipos (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    symbol TEXT NOT NULL,
    price_band TEXT NOT NULL,
    lot_size INT NOT NULL,
    issue_size TEXT NOT NULL,
    open_date DATE NOT NULL,
    close_date DATE NOT NULL,
    listing_date DATE NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UPCOMING', 'LISTED')),
    gmp TEXT,
    min_investment NUMERIC(10, 2) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS ipo_applications (
    id TEXT PRIMARY KEY DEFAULT ('app_' || substr(md5(random()::text), 1, 10)),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    ipo_id TEXT REFERENCES ipos(id),
    lots INT NOT NULL,
    upi_id TEXT NOT NULL,
    amount_blocked NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'Submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Price Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY DEFAULT ('alt_' || substr(md5(random()::text), 1, 10)),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    condition TEXT NOT NULL,
    target_value NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('log_' || substr(md5(random()::text), 1, 10)),
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    status TEXT DEFAULT 'SUCCESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
