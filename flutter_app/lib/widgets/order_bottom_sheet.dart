import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/stock_model.dart';
import '../providers/portfolio_provider.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';

class OrderBottomSheet extends StatefulWidget {
  final StockModel stock;
  final String initialSide;

  const OrderBottomSheet({
    Key? key,
    required this.stock,
    this.initialSide = 'BUY',
  }) : super(key: key);

  static void show(BuildContext context, StockModel stock, {String side = 'BUY'}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => OrderBottomSheet(stock: stock, initialSide: side),
    );
  }

  @override
  State<OrderBottomSheet> createState() => _OrderBottomSheetState();
}

class _OrderBottomSheetState extends State<OrderBottomSheet> {
  late String _side;
  String _productType = 'CNC'; // CNC or MIS
  String _orderType = 'MARKET'; // MARKET, LIMIT, SL
  int _quantity = 1;
  late double _price;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _side = widget.initialSide;
    _price = widget.stock.price;
  }

  @override
  Widget build(BuildContext context) {
    final isBuy = _side == 'BUY';
    final charges = CalculationService.calculateCharges(
      productType: _productType,
      side: _side,
      price: _price,
      quantity: _quantity,
    );

    final requiredMargin = _productType == 'MIS' ? (_price * _quantity * 0.20) : (_price * _quantity);

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Symbol, Price, and Side Selector
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          widget.stock.symbol,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.grey.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('NSE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                    Text(
                      CalculationService.formatMoney(widget.stock.price),
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                  ],
                ),
                // Side Switcher (BUY / SELL)
                Container(
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      _buildSideToggle('BUY', AppTheme.gainGreen),
                      _buildSideToggle('SELL', AppTheme.lossRed),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Product Type (CNC vs MIS)
            Row(
              children: [
                Expanded(
                  child: _buildChoiceChip(
                    'Delivery (CNC)',
                    'Long Term (0% Brokerage)',
                    _productType == 'CNC',
                    () => setState(() => _productType = 'CNC'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildChoiceChip(
                    'Intraday (MIS)',
                    '5x Leverage (Square-off 3:15 PM)',
                    _productType == 'MIS',
                    () => setState(() => _productType = 'MIS'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Order Type (Market, Limit, SL)
            Row(
              children: ['MARKET', 'LIMIT', 'SL'].map((ot) {
                final isSelected = _orderType == ot;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _orderType = ot),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.brandPrimary.withOpacity(0.15) : Colors.transparent,
                        border: Border.all(
                          color: isSelected ? AppTheme.brandPrimary : Colors.grey.withOpacity(0.3),
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        ot,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: isSelected ? AppTheme.brandPrimary : Colors.grey,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Quantity & Limit Price Input
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Quantity', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 4),
                      TextFormField(
                        initialValue: _quantity.toString(),
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        onChanged: (v) {
                          setState(() {
                            _quantity = int.tryParse(v) ?? 1;
                          });
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Price (₹)', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 4),
                      TextFormField(
                        initialValue: _price.toStringAsFixed(2),
                        enabled: _orderType != 'MARKET',
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          border: const OutlineInputBorder(),
                          filled: _orderType == 'MARKET',
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        onChanged: (v) {
                          setState(() {
                            _price = double.tryParse(v) ?? widget.stock.price;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Charges & Margin Summary Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Required Margin', style: TextStyle(fontSize: 13, color: Colors.grey)),
                      Text(
                        CalculationService.formatMoney(requiredMargin),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Est. Charges (STT + GST + SEBI)', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      Text(
                        CalculationService.formatMoney(charges['totalCharges'] ?? 0.0),
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: isBuy ? AppTheme.gainGreen : AppTheme.lossRed,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _isSubmitting ? null : _handleSubmit,
                child: _isSubmitting
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white))
                    : Text(
                        '$_side ${widget.stock.symbol}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSideToggle(String side, Color activeColor) {
    final isSelected = _side == side;
    return GestureDetector(
      onTap: () => setState(() => _side = side),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? activeColor : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          side,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 12,
            color: isSelected ? Colors.white : Colors.grey,
          ),
        ),
      ),
    );
  }

  Widget _buildChoiceChip(String title, String subtitle, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.brandPrimary.withOpacity(0.12) : Colors.transparent,
          border: Border.all(
            color: isSelected ? AppTheme.brandPrimary : Colors.grey.withOpacity(0.3),
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: isSelected ? AppTheme.brandPrimary : null)),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    setState(() => _isSubmitting = true);
    try {
      final success = await context.read<PortfolioProvider>().placeOrder(
            symbol: widget.stock.symbol,
            side: _side,
            orderType: _orderType,
            productType: _productType,
            quantity: _quantity,
            price: _price,
          );

      if (success && mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order executed: $_side $_quantity ${widget.stock.symbol}'),
            backgroundColor: AppTheme.gainGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppTheme.lossRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }
}
