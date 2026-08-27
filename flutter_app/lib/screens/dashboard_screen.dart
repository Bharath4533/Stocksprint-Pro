import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/market_provider.dart';
import '../providers/portfolio_provider.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';
import '../widgets/stock_card.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final market = context.watch<MarketProvider>();
    final portfolio = context.watch<PortfolioProvider>();
    final summary = portfolio.summary;

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          market.loadMarketOverview(),
          portfolio.loadPortfolio(),
        ]);
      },
      child: ListView(
        padding: const EdgeInsets.symmetric(vertical: 12),
        children: [
          // Benchmark Indices Live Ticker Ribbon
          if (market.indices.isNotEmpty)
            SizedBox(
              height: 72,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: market.indices.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final idx = market.indices[index];
                  final isGain = idx.percentChange >= 0;
                  return Container(
                    width: 140,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Theme.of(context).dividerColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(idx.symbol, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Colors.grey)),
                        const SizedBox(height: 2),
                        Text(
                          CalculationService.formatNumber(idx.value),
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                        Text(
                          CalculationService.formatPercent(idx.percentChange),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: isGain ? AppTheme.gainGreen : AppTheme.lossRed,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          const SizedBox(height: 16),

          // Portfolio Snapshot Hero Card
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.brandPrimary.withOpacity(0.15),
                    Theme.of(context).cardColor,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'TOTAL PORTFOLIO VALUE',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.simulatedBadge.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('PAPER TRADING', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppTheme.simulatedBadge)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    CalculationService.formatMoney(summary?.totalPortfolioValue ?? 0.0),
                    style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Invested', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          Text(
                            CalculationService.formatMoney(summary?.totalInvested ?? 0.0),
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Overall Returns', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          Text(
                            '${(summary?.overallPnL ?? 0) >= 0 ? '+' : ''}${CalculationService.formatMoney(summary?.overallPnL ?? 0.0)} (${CalculationService.formatPercent(summary?.overallPnLPercent ?? 0.0)})',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                              color: (summary?.overallPnL ?? 0) >= 0 ? AppTheme.gainGreen : AppTheme.lossRed,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Top Gainers Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Text('🔥 Top Gainers (NSE)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          if (market.gainers.isEmpty)
            const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
          else
            ...market.gainers.take(4).map((s) => StockCardTile(stock: s)),

          const SizedBox(height: 16),

          // Top Losers Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Text('📉 Top Losers (NSE)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          if (market.losers.isNotEmpty)
            ...market.losers.take(4).map((s) => StockCardTile(stock: s)),
        ],
      ),
    );
  }
}
