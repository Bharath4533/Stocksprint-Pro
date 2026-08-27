import 'package:flutter/material.dart';
import '../models/ipo_model.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';

class IpoScreen extends StatefulWidget {
  const IpoScreen({Key? key}) : super(key: key);

  @override
  State<IpoScreen> createState() => _IpoScreenState();
}

class _IpoScreenState extends State<IpoScreen> {
  List<IpoModel> _ipos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadIpos();
  }

  Future<void> _loadIpos() async {
    try {
      final res = await ApiService.get(ApiConfig.ipos);
      if (res is List && mounted) {
        setState(() {
          _ipos = res.map((i) => IpoModel.fromJson(i)).toList();
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
      appBar: AppBar(title: const Text('IPO Hub')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _ipos.length,
              itemBuilder: (context, index) {
                final ipo = _ipos[index];
                final isOpen = ipo.status == 'OPEN';

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(ipo.company, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: isOpen ? AppTheme.gainGreen.withOpacity(0.15) : Colors.grey.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                ipo.status,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: isOpen ? AppTheme.gainGreen : Colors.grey,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (ipo.gmp != null) ...[
                          const SizedBox(height: 4),
                          Text('GMP: ${ipo.gmp}', style: const TextStyle(color: AppTheme.gainGreen, fontWeight: FontWeight.w700, fontSize: 12)),
                        ],
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Price Band', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                Text(ipo.priceBand, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Lot Size', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                Text('${ipo.lotSize} shares', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('Min. Amount', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                Text(CalculationService.formatMoney(ipo.minInvestment), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                              ],
                            ),
                          ],
                        ),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Bidding: ${ipo.openDate} - ${ipo.closeDate}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isOpen ? AppTheme.brandPrimary : Colors.grey,
                              ),
                              onPressed: isOpen ? () => _applyIpoDialog(context, ipo) : null,
                              child: Text(
                                isOpen ? 'Apply Now' : 'Closed',
                                style: TextStyle(color: isOpen ? Colors.black : Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _applyIpoDialog(BuildContext context, IpoModel ipo) {
    final upiController = TextEditingController(text: 'bharath@okhdfcbank');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Apply for ${ipo.company} IPO'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Lot Size: ${ipo.lotSize} shares (₹${ipo.minInvestment.toInt()})'),
            const SizedBox(height: 12),
            TextField(
              controller: upiController,
              decoration: const InputDecoration(labelText: 'UPI ID (Simulated Mandate)', border: OutlineInputBorder()),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.brandPrimary),
            onPressed: () async {
              Navigator.pop(ctx);
              await ApiService.post('${ApiConfig.ipos}/${ipo.id}/apply', {
                'lots': 1,
                'upiId': upiController.text,
              });
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Applied for ${ipo.company} IPO!'), backgroundColor: AppTheme.gainGreen),
                );
              }
            },
            child: const Text('Submit Application', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}
