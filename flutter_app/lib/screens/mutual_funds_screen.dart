import 'package:flutter/material.dart';
import '../models/mutual_fund_model.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';

class MutualFundsScreen extends StatefulWidget {
  const MutualFundsScreen({Key? key}) : super(key: key);

  @override
  State<MutualFundsScreen> createState() => _MutualFundsScreenState();
}

class _MutualFundsScreenState extends State<MutualFundsScreen> {
  List<MutualFundModel> _funds = [];
  bool _isLoading = true;

  // Quick SIP Simulator variables
  double _monthlySip = 10000;
  double _expectedReturn = 14;
  int _years = 10;

  @override
  void initState() {
    super.initState();
    _loadFunds();
  }

  Future<void> _loadFunds() async {
    try {
      final res = await ApiService.get(ApiConfig.mutualFunds);
      if (res is List && mounted) {
        setState(() {
          _funds = res.map((f) => MutualFundModel.fromJson(f)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final projection = CalculationService.calculateSIPProjection(
      monthlyAmount: _monthlySip,
      annualRate: _expectedReturn,
      years: _years,
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Direct Mutual Funds & SIP')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // SIP Wealth Simulator Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Text('🌱 SIP Wealth Calculator', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                          Text('12% CAGR Baseline', style: TextStyle(fontSize: 10, color: Colors.grey)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Monthly: ₹${_monthlySip.toInt()}'),
                          Text('Return: ${_expectedReturn.toInt()}%'),
                          Text('Tenure: $_years Years'),
                        ],
                      ),
                      Slider(
                        value: _monthlySip,
                        min: 1000,
                        max: 100000,
                        divisions: 99,
                        activeColor: AppTheme.brandPrimary,
                        onChanged: (v) => setState(() => _monthlySip = v),
                      ),
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Invested', style: TextStyle(fontSize: 11, color: Colors.grey)),
                              Text(CalculationService.formatMoney(projection['totalInvested']), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Wealth Gain', style: TextStyle(fontSize: 11, color: Colors.grey)),
                              Text(
                                '+${CalculationService.formatMoney(projection['estimatedWealthGain'])}',
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.gainGreen),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text('Future Value', style: TextStyle(fontSize: 11, color: Colors.grey)),
                              Text(
                                CalculationService.formatMoney(projection['projectedFutureValue']),
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppTheme.brandPrimary),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                const Text('🔥 Top Direct Mutual Funds', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),

                ..._funds.map((fund) => Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(fund.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.gainGreen.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    '${fund.returns3Y} (3Y)',
                                    style: const TextStyle(color: AppTheme.gainGreen, fontWeight: FontWeight.w800, fontSize: 11),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text('${fund.category} • NAV: ₹${fund.nav} • AUM: ${fund.aum}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Min. SIP: ₹${fund.minSipAmount.toInt()}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.brandPrimary, padding: const EdgeInsets.symmetric(horizontal: 16)),
                                  onPressed: () => _startSipDialog(context, fund),
                                  child: const Text('Start SIP', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 12)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    )),
              ],
            ),
    );
  }

  void _startSipDialog(BuildContext context, MutualFundModel fund) {
    final controller = TextEditingController(text: fund.minSipAmount.toInt().toString());
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Start Monthly SIP in ${fund.name}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Monthly SIP Amount (₹)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            const Text('Deducted monthly on the 10th from simulated balance.', style: TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.brandPrimary),
            onPressed: () async {
              final amt = double.tryParse(controller.text) ?? fund.minSipAmount;
              Navigator.pop(ctx);
              await ApiService.post('${ApiConfig.mutualFunds}/sips', {
                'fundId': fund.id,
                'amount': amt,
                'sipDate': 10,
              });
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Simulated SIP started successfully!'), backgroundColor: AppTheme.gainGreen),
                );
              }
            },
            child: const Text('Confirm SIP', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}
