import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({Key? key}) : super(key: key);

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  List<AlertModel> _alerts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAlerts();
  }

  Future<void> _loadAlerts() async {
    try {
      final res = await ApiService.get(ApiConfig.alerts);
      if (res is List && mounted) {
        setState(() {
          _alerts = res.map((a) => AlertModel.fromJson(a)).toList();
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
      appBar: AppBar(
        title: const Text('Price Alerts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_alert),
            onPressed: () => _showAddAlertDialog(context),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _alerts.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.notifications_none, size: 48, color: Colors.grey),
                      const SizedBox(height: 12),
                      const Text('No price alerts set', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      const SizedBox(height: 6),
                      const Text('Get notified when stocks hit your targets', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('Set Alert'),
                        onPressed: () => _showAddAlertDialog(context),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _alerts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final a = _alerts[index];
                    return Card(
                      child: ListTile(
                        leading: const CircleAvatar(
                          backgroundColor: Colors.transparent,
                          child: Icon(Icons.trending_up, color: AppTheme.brandPrimary),
                        ),
                        title: Text(a.symbol, style: const TextStyle(fontWeight: FontWeight.w800)),
                        subtitle: Text('${a.condition} ₹${a.targetValue} • Current: ₹${a.currentPrice}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.grey),
                          onPressed: () async {
                            await ApiService.delete('${ApiConfig.alerts}/${a.id}');
                            _loadAlerts();
                          },
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  void _showAddAlertDialog(BuildContext context) {
    final symController = TextEditingController(text: 'RELIANCE');
    final valController = TextEditingController(text: '3100');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Set Price Alert'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: symController, decoration: const InputDecoration(labelText: 'Symbol', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: valController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Target Price (₹)', border: OutlineInputBorder())),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ApiService.post(ApiConfig.alerts, {
                'symbol': symController.text.trim().toUpperCase(),
                'condition': 'PRICE_ABOVE',
                'targetValue': double.tryParse(valController.text) ?? 3000.0,
              });
              _loadAlerts();
            },
            child: const Text('Create Alert'),
          ),
        ],
      ),
    );
  }
}
