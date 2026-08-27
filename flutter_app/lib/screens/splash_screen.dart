import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/market_provider.dart';
import '../providers/portfolio_provider.dart';
import '../providers/watchlist_provider.dart';
import '../config/app_theme.dart';
import 'main_navigation_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    final authProvider = context.read<AuthProvider>();
    final isAuthed = await authProvider.initSession();

    if (mounted && isAuthed) {
      // Load initial market & portfolio data
      await Future.wait([
        context.read<MarketProvider>().loadMarketOverview(),
        context.read<PortfolioProvider>().loadPortfolio(),
        context.read<WatchlistProvider>().loadWatchlists(),
      ]);

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.brandPrimary,
                borderRadius: BorderRadius.circular(20),
              ),
              alignment: Alignment.center,
              child: const Text(
                'S',
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Stock',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
                ),
                Text(
                  'Sprint',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.brandPrimary),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.brandPrimary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'PRO',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.brandPrimary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Indian Stock Trading & Investment',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 32),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
