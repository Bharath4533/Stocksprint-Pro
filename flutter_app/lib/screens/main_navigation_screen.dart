import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../config/app_theme.dart';
import '../widgets/search_dialog.dart';
import 'dashboard_screen.dart';
import 'markets_screen.dart';
import 'watchlist_screen.dart';
import 'portfolio_screen.dart';
import 'orders_screen.dart';
import 'funds_screen.dart';
import 'mutual_funds_screen.dart';
import 'ipo_screen.dart';
import 'alerts_screen.dart';
import 'kyc_onboarding_screen.dart';
import 'profile_screen.dart';
import 'support_screen.dart';
import 'admin_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({Key? key}) : super(key: key);

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    MarketsScreen(),
    WatchlistScreen(),
    PortfolioScreen(),
    OrdersScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.brandPrimary,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'S',
                style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 16),
              ),
            ),
            const SizedBox(width: 8),
            const Text('StockSprint Pro', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => GlobalSearchDialog.show(context),
          ),
          IconButton(
            icon: const Icon(Icons.brightness_4),
            onPressed: () => auth.toggleTheme(),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AlertsScreen()));
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(color: AppTheme.darkSurface),
              accountName: Text(
                user?.name ?? 'Bharath Devan',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
              accountEmail: Text(
                user?.email ?? 'demo@nextrade.in',
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              ),
              currentAccountPicture: CircleAvatar(
                backgroundColor: AppTheme.brandPrimary,
                child: Text(
                  (user?.name ?? 'BD').substring(0, 2).toUpperCase(),
                  style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 20),
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.account_balance_wallet),
              title: const Text('Funds & Margin'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const FundsScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.pie_chart),
              title: const Text('Mutual Funds & SIP'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const MutualFundsScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.local_offer),
              title: const Text('IPO Hub'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const IpoScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.verified_user),
              title: const Text('KYC Onboarding'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const KycOnboardingScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.notifications),
              title: const Text('Price Alerts'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const AlertsScreen()));
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('Profile & Security'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.help_outline),
              title: const Text('Help & Support'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const SupportScreen()));
              },
            ),
            if (user?.role == 'ADMIN')
              ListTile(
                leading: const Icon(Icons.admin_panel_settings, color: AppTheme.lossRed),
                title: const Text('Admin Panel'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminScreen()));
                },
              ),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.candlestick_chart), label: 'Markets'),
          BottomNavigationBarItem(icon: Icon(Icons.bookmark_border), label: 'Watchlist'),
          BottomNavigationBarItem(icon: Icon(Icons.work_outline), label: 'Portfolio'),
          BottomNavigationBarItem(icon: Icon(Icons.list_alt), label: 'Orders'),
        ],
      ),
    );
  }
}
