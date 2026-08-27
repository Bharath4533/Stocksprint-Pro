import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/portfolio_provider.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';
import '../widgets/metric_tile.dart';

class FundsScreen extends StatefulWidget {
  const FundsScreen({Key? key}) : super(key: key);

  @override
  State<FundsScreen> createState() => _FundsScreenState();
}

class _FundsScreenState extends State<FundsScreen> {
  List<dynamic> _transactions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFunds();
  }

  Future<void> _loadFunds() async {
    final portfolio = context.read<PortfolioProvider>();
    await portfolio.loadPortfolio();
    try {
      final txns = await ApiService.get('${ApiConfig.funds}/transactions');
      if (txns is List && mounted) {
        setState(() {
          _transactions = txns;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final portfolio = context.watch<PortfolioProvider>();
    final summary = portfolio.summary;

    return Scaffold(
      appBar: AppBar(title: const Text('Funds & Margin')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadFunds,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Balance Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.brandPrimary.withOpacity(0.18),
                          Theme.of(context).cardColor,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Theme.of(context).dividerColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('AVAILABLE SIMULATED CASH', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey)),
                        const SizedBox(height: 6),
                        Text(
                          CalculationService.formatMoney(summary?.availableCash ?? 0.0),
                          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.brandPrimary),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                icon: const Icon(Icons.add, color: Colors.black),
                                label: const Text('Add Funds', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800)),
                                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.brandPrimary),
                                onPressed: () => _showAddFundsDialog(context),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton.icon(
                                icon: const Icon(Icons.arrow_upward),
                                label: const Text('Withdraw'),
                                onPressed: () => _showWithdrawDialog(context),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Margin Metrics Grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 2.2,
                    children: [
                      MetricTile(label: 'Used Margin', value: CalculationService.formatMoney(summary?.usedMargin ?? 0.0)),
                      MetricTile(label: 'Total Capital', value: CalculationService.formatMoney((summary?.availableCash ?? 0.0) + (summary?.usedMargin ?? 0.0))),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Transaction Ledger Header
                  const Text('📜 Transaction Ledger', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),

                  if (_transactions.isEmpty)
                    const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('No transactions recorded.')))
                  else
                    ..._transactions.map((t) {
                      final isCredit = t['type'] == 'DEPOSIT' || t['type'] == 'SELL_TRADE';
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: (isCredit ? AppTheme.gainGreen : AppTheme.lossRed).withOpacity(0.15),
                            child: Icon(
                              isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                              color: isCredit ? AppTheme.gainGreen : AppTheme.lossRed,
                              size: 18,
                            ),
                          ),
                          title: Text(t['description'] ?? t['type'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                          subtitle: Text(t['paymentMethod'] ?? 'Simulated Transfer', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                          trailing: Text(
                            '${isCredit ? '+' : '-'}${CalculationService.formatMoney((t['amount'] as num).toDouble())}',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                              color: isCredit ? AppTheme.gainGreen : AppTheme.lossRed,
                            ),
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }

  void _showAddFundsDialog(BuildContext context) {
    final controller = TextEditingController(text: '100000');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Simulated Funds'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (₹)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            const Text('Instant simulated credit via UPI / Netbanking.', style: TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.brandPrimary),
            onPressed: () async {
              final amt = double.tryParse(controller.text) ?? 50000.0;
              Navigator.pop(ctx);
              await ApiService.post('${ApiConfig.funds}/deposit', {'amount': amt, 'paymentMethod': 'UPI (Simulated)'});
              _loadFunds();
            },
            child: const Text('Deposit Now', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }

  void _showWithdrawDialog(BuildContext context) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Withdraw Funds'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Amount (₹)', border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final amt = double.tryParse(controller.text) ?? 0.0;
              Navigator.pop(ctx);
              await ApiService.post('${ApiConfig.funds}/withdraw', {'amount': amt});
              _loadFunds();
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }
}
