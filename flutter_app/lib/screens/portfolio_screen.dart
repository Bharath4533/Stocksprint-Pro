import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/portfolio_provider.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';
import '../screens/stock_detail_screen.dart';

class PortfolioScreen extends StatefulWidget {
  const PortfolioScreen({Key? key}) : super(key: key);

  @override
  State<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends State<PortfolioScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final portfolio = context.watch<PortfolioProvider>();
    final summary = portfolio.summary;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => portfolio.loadPortfolio(),
        child: Column(
          children: [
            // Portfolio Summary Card
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Value', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          const SizedBox(height: 2),
                          Text(
                            CalculationService.formatMoney(summary?.totalPortfolioValue ?? 0.0),
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Overall P&L', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          const SizedBox(height: 2),
                          Text(
                            '${(summary?.overallPnL ?? 0) >= 0 ? '+' : ''}${CalculationService.formatMoney(summary?.overallPnL ?? 0.0)}',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: (summary?.overallPnL ?? 0) >= 0 ? AppTheme.gainGreen : AppTheme.lossRed,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Invested: ${CalculationService.formatMoney(summary?.totalInvested ?? 0.0)}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      Text('Available Cash: ${CalculationService.formatMoney(summary?.availableCash ?? 0.0)}', style: const TextStyle(fontSize: 12, color: AppTheme.brandPrimary, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ],
              ),
            ),

            // Tab Bar: Holdings vs Positions
            TabBar(
              controller: _tabController,
              tabs: [
                Tab(text: 'Holdings (${portfolio.holdings.length})'),
                Tab(text: 'Positions (${portfolio.positions.length})'),
              ],
            ),

            // Tab Views
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Holdings List
                  portfolio.holdings.isEmpty
                      ? const Center(child: Text('No delivery holdings yet.'))
                      : ListView.separated(
                          itemCount: portfolio.holdings.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final h = portfolio.holdings[index];
                            final isGain = h.unrealizedPnL >= 0;
                            return ListTile(
                              onTap: () {
                                Navigator.push(context, MaterialPageRoute(builder: (_) => StockDetailScreen(symbol: h.symbol)));
                              },
                              title: Row(
                                children: [
                                  Text(h.symbol, style: const TextStyle(fontWeight: FontWeight.w800)),
                                  const SizedBox(width: 6),
                                  Text('${h.quantity} shares', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                ],
                              ),
                              subtitle: Text('Avg. ₹${h.averageBuyPrice.toStringAsFixed(2)} • LTP ₹${h.currentPrice.toStringAsFixed(2)}'),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(CalculationService.formatMoney(h.currentValue), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                  Text(
                                    '${isGain ? '+' : ''}${CalculationService.formatMoney(h.unrealizedPnL)} (${CalculationService.formatPercent(h.unrealizedPnLPercent)})',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: isGain ? AppTheme.gainGreen : AppTheme.lossRed,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),

                  // Positions List
                  portfolio.positions.isEmpty
                      ? const Center(child: Text('No open intraday positions.'))
                      : ListView.separated(
                          itemCount: portfolio.positions.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final p = portfolio.positions[index];
                            final pnl = p.status == 'OPEN' ? p.unrealizedPnL : p.realizedPnL;
                            final isGain = pnl >= 0;

                            return ListTile(
                              title: Row(
                                children: [
                                  Text(p.symbol, style: const TextStyle(fontWeight: FontWeight.w800)),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                    decoration: BoxDecoration(color: Colors.blue.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                                    child: Text(p.side, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.blue)),
                                  ),
                                ],
                              ),
                              subtitle: Text('Qty: ${p.quantity} • Avg: ₹${p.averagePrice}'),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(CalculationService.formatMoney(pnl), style: TextStyle(fontWeight: FontWeight.w800, color: isGain ? AppTheme.gainGreen : AppTheme.lossRed)),
                                      Text(p.status, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                    ],
                                  ),
                                  if (p.status == 'OPEN') ...[
                                    const SizedBox(width: 8),
                                    TextButton(
                                      style: TextButton.styleFrom(foregroundColor: AppTheme.lossRed),
                                      onPressed: () => _confirmSquareOff(context, p.id, p.symbol),
                                      child: const Text('Exit'),
                                    ),
                                  ],
                                ],
                              ),
                            );
                          },
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmSquareOff(BuildContext context, String posId, String symbol) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Square Off $symbol?'),
        content: Text('Are you sure you want to exit intraday position for $symbol at market price?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.lossRed),
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<PortfolioProvider>().squareOffPosition(posId);
            },
            child: const Text('Square Off', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
