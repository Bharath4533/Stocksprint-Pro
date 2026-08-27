import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/portfolio_provider.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({Key? key}) : super(key: key);

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<PortfolioProvider>().loadOrders();
  }

  @override
  Widget build(BuildContext context) {
    final portfolio = context.watch<PortfolioProvider>();

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(48),
        child: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Executed (${portfolio.executedOrders.length})'),
            Tab(text: 'Open (${portfolio.openOrders.length})'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => portfolio.loadOrders(),
        child: TabBarView(
          controller: _tabController,
          children: [
            // Executed Orders
            portfolio.executedOrders.isEmpty
                ? const Center(child: Text('No executed orders yet.'))
                : ListView.separated(
                    itemCount: portfolio.executedOrders.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final o = portfolio.executedOrders[index];
                      final isBuy = o.side == 'BUY';
                      return ListTile(
                        title: Row(
                          children: [
                            Text(o.symbol, style: const TextStyle(fontWeight: FontWeight.w800)),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: (isBuy ? AppTheme.gainGreen : AppTheme.lossRed).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                o.side,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: isBuy ? AppTheme.gainGreen : AppTheme.lossRed,
                                ),
                              ),
                            ),
                          ],
                        ),
                        subtitle: Text('${o.productType} • ${o.orderType} • Qty: ${o.quantity}'),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(CalculationService.formatMoney(o.price), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                            Text(o.status, style: const TextStyle(fontSize: 11, color: AppTheme.gainGreen, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      );
                    },
                  ),

            // Open Orders
            portfolio.openOrders.isEmpty
                ? const Center(child: Text('No open orders.'))
                : ListView.separated(
                    itemCount: portfolio.openOrders.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final o = portfolio.openOrders[index];
                      return ListTile(
                        title: Text(o.symbol, style: const TextStyle(fontWeight: FontWeight.w800)),
                        subtitle: Text('${o.side} • ${o.productType} • Limit: ₹${o.price}'),
                        trailing: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.lossRed, padding: const EdgeInsets.symmetric(horizontal: 12)),
                          onPressed: () => portfolio.cancelOrder(o.id),
                          child: const Text('Cancel', style: TextStyle(color: Colors.white, fontSize: 12)),
                        ),
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }
}
