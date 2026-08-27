import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/stock_model.dart';
import '../providers/market_provider.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';
import '../widgets/stock_candlestick_chart.dart';
import '../widgets/order_bottom_sheet.dart';
import '../widgets/metric_tile.dart';

class StockDetailScreen extends StatefulWidget {
  final String symbol;

  const StockDetailScreen({Key? key, required this.symbol}) : super(key: key);

  @override
  State<StockDetailScreen> createState() => _StockDetailScreenState();
}

class _StockDetailScreenState extends State<StockDetailScreen> {
  StockModel? _stock;
  bool _isLoading = true;
  bool _isCandle = true;
  String _timeframe = '1D';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final market = context.read<MarketProvider>();
    final stock = await market.getStockDetail(widget.symbol);
    if (mounted) {
      setState(() {
        _stock = stock;
        _isLoading = false;
      });
      market.loadCandles(widget.symbol, _timeframe);
    }
  }

  @override
  Widget build(BuildContext context) {
    final market = context.watch<MarketProvider>();

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.symbol)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_stock == null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.symbol)),
        body: const Center(child: Text('Stock data not found')),
      );
    }

    final isGain = _stock!.percentChange >= 0;
    final changeColor = isGain ? AppTheme.gainGreen : AppTheme.lossRed;

    return Scaffold(
      appBar: AppBar(
        title: Text(_stock!.symbol),
        actions: [
          IconButton(
            icon: Icon(_isCandle ? Icons.show_chart : Icons.candlestick_chart),
            onPressed: () => setState(() => _isCandle = !_isCandle),
            tooltip: 'Toggle Chart Style',
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.gainGreen,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () => OrderBottomSheet.show(context, _stock!, side: 'BUY'),
                child: const Text('BUY', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.lossRed,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () => OrderBottomSheet.show(context, _stock!, side: 'SELL'),
                child: const Text('SELL', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header: Name, Price, % Change
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_stock!.name, style: const TextStyle(fontSize: 14, color: Colors.grey)),
                  const SizedBox(height: 4),
                  Text(
                    CalculationService.formatMoney(_stock!.price),
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: changeColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${CalculationService.formatPercent(_stock!.percentChange)} (${CalculationService.formatMoney(_stock!.change)})',
                  style: TextStyle(color: changeColor, fontWeight: FontWeight.w800, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Interactive Canvas Chart Widget
          StockCandlestickChart(
            candles: market.activeCandles,
            isCandlestick: _isCandle,
            activeTimeframe: _timeframe,
            onTimeframeChanged: (tf) {
              setState(() => _timeframe = tf);
              market.loadCandles(widget.symbol, tf);
            },
          ),
          const SizedBox(height: 24),

          // Fundamentals Grid
          const Text('📊 Key Fundamentals', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 2.2,
            children: [
              MetricTile(label: 'Market Cap', value: CalculationService.formatMoney(_stock!.marketCap, compact: true)),
              MetricTile(label: 'P/E Ratio', value: _stock!.fundamentals?['peRatio']?.toString() ?? '24.5'),
              MetricTile(label: 'P/B Ratio', value: _stock!.fundamentals?['pbRatio']?.toString() ?? '3.2'),
              MetricTile(label: 'EPS (TTM)', value: '₹${_stock!.fundamentals?['eps']?.toString() ?? '45.8'}'),
              MetricTile(label: 'ROE (%)', value: '${_stock!.fundamentals?['roe']?.toString() ?? '18.4'}%'),
              MetricTile(label: 'Div. Yield', value: '${_stock!.fundamentals?['dividendYield']?.toString() ?? '1.2'}%'),
            ],
          ),
          const SizedBox(height: 24),

          // Day's Range Indicator
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Day's High / Low", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('L: ₹${_stock!.low}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    Text('H: ₹${_stock!.high}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
                const SizedBox(height: 6),
                LinearProgressIndicator(
                  value: ((_stock!.price - _stock!.low) / ((_stock!.high - _stock!.low) == 0 ? 1 : (_stock!.high - _stock!.low))).clamp(0.0, 1.0),
                  backgroundColor: Colors.grey.withOpacity(0.2),
                  color: AppTheme.brandPrimary,
                  minHeight: 6,
                  borderRadius: BorderRadius.circular(3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
