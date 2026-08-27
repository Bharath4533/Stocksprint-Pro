import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/market_provider.dart';
import '../widgets/stock_card.dart';

class MarketsScreen extends StatefulWidget {
  const MarketsScreen({Key? key}) : super(key: key);

  @override
  State<MarketsScreen> createState() => _MarketsScreenState();
}

class _MarketsScreenState extends State<MarketsScreen> {
  String _selectedSector = 'ALL';

  final List<String> _sectors = [
    'ALL',
    'Technology',
    'Banking & Financials',
    'Energy & Petrochemicals',
    'Automobile',
    'Consumer & Retail',
    'Infrastructure',
  ];

  @override
  Widget build(BuildContext context) {
    final market = context.watch<MarketProvider>();
    var filteredStocks = market.stocks;

    if (_selectedSector != 'ALL') {
      filteredStocks = filteredStocks.where((s) => s.sector.toLowerCase().contains(_selectedSector.toLowerCase())).toList();
    }

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => market.loadMarketOverview(),
        child: Column(
          children: [
            // Sector Filter Chips
            SizedBox(
              height: 48,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                itemCount: _sectors.length,
                itemBuilder: (context, index) {
                  final sector = _sectors[index];
                  final isSelected = _selectedSector == sector;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(sector, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.w700 : FontWeight.normal)),
                      selected: isSelected,
                      onSelected: (_) => setState(() => _selectedSector = sector),
                    ),
                  );
                },
              ),
            ),
            // Stocks List
            Expanded(
              child: filteredStocks.isEmpty
                  ? const Center(child: Text('No stocks in this category'))
                  : ListView.builder(
                      itemCount: filteredStocks.length,
                      itemBuilder: (context, index) => StockCardTile(stock: filteredStocks[index]),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
