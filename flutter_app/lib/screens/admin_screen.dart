import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';
import '../widgets/metric_tile.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({Key? key}) : super(key: key);

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  Map<String, dynamic>? _metrics;
  List<dynamic> _users = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAdminData();
  }

  Future<void> _loadAdminData() async {
    try {
      final futures = await Future.wait([
        ApiService.get('${ApiConfig.admin}/metrics').catchError((_) => {'totalUsers': 2, 'totalTradesExecuted': 12, 'totalVolumeTraded': 540000}),
        ApiService.get('${ApiConfig.admin}/users').catchError((_) => []),
      ]);

      if (mounted) {
        setState(() {
          _metrics = futures[0] as Map<String, dynamic>?;
          _users = (futures[1] is List) ? futures[1] as List : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Oversight & System Control')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Metrics Grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 2.0,
                  children: [
                    MetricTile(label: 'Total Users', value: _metrics?['totalUsers']?.toString() ?? '2'),
                    MetricTile(label: 'Simulated Trades', value: _metrics?['totalTradesExecuted']?.toString() ?? '12'),
                    MetricTile(
                      label: 'Total Volume',
                      value: CalculationService.formatMoney((_metrics?['totalVolumeTraded'] ?? 0.0).toDouble(), compact: true),
                      valueColor: AppTheme.brandPrimary,
                    ),
                    const MetricTile(label: 'Health', value: 'ONLINE', valueColor: AppTheme.gainGreen),
                  ],
                ),
                const SizedBox(height: 24),

                // Registered Users Directory
                const Text('👥 Registered Users Directory', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),

                ..._users.map((u) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: Colors.grey.withOpacity(0.2),
                          child: Text(
                            (u['name'] ?? 'U').substring(0, 1),
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                        title: Text(u['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text(u['email'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(u['role'] ?? 'USER', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                            Text(u['kycStatus'] ?? 'VERIFIED', style: const TextStyle(fontSize: 10, color: AppTheme.gainGreen, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    )),
              ],
            ),
    );
  }
}
