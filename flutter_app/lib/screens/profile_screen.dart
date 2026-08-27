import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../config/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile & Security')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Header Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppTheme.brandPrimary,
                  child: Text(
                    (user?.name ?? 'BD').substring(0, 2).toUpperCase(),
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.black),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? 'Bharath Devan', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                      Text(user?.email ?? 'demo@nextrade.in', style: const TextStyle(fontSize: 13, color: Colors.grey)),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.gainGreen.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('KYC VERIFIED', style: TextStyle(color: AppTheme.gainGreen, fontWeight: FontWeight.w800, fontSize: 10)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Masked Personal & Bank Info
          const Text('🔒 Verified Indian KYC Details', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          Card(
            child: Column(
              children: const [
                ListTile(
                  leading: Icon(Icons.credit_card),
                  title: Text('PAN Number'),
                  trailing: Text('ABC****34F', style: TextStyle(fontWeight: FontWeight.w700, fontFamily: 'monospace')),
                ),
                Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.account_balance),
                  title: Text('Linked Bank Account'),
                  subtitle: Text('HDFC Bank (Penny Drop Verified)'),
                  trailing: Text('XXXXXXX7192', style: TextStyle(fontWeight: FontWeight.w700, fontFamily: 'monospace')),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Preferences & Theme
          const Text('⚙️ Preferences', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Dark Mode'),
                  subtitle: const Text('Switch between dark and light fintech themes'),
                  value: auth.themeMode == ThemeMode.dark,
                  onChanged: (_) => auth.toggleTheme(),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.refresh),
                  title: const Text('Reset Paper Trading Balance'),
                  subtitle: const Text('Replenish virtual funds to ₹5,00,000'),
                  onTap: () async {
                    await ApiService.post('${ApiConfig.funds}/deposit', {'amount': 500000});
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Simulated balance reset to ₹5,00,000'), backgroundColor: AppTheme.gainGreen),
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
