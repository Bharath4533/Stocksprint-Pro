import 'package:flutter/material.dart';
import '../models/stock_model.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';
import '../screens/stock_detail_screen.dart';

class StockCardTile extends StatelessWidget {
  final StockModel stock;

  const StockCardTile({Key? key, required this.stock}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isGain = stock.percentChange >= 0;
    final changeColor = isGain ? AppTheme.gainGreen : AppTheme.lossRed;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => StockDetailScreen(symbol: stock.symbol)),
          );
        },
        title: Row(
          children: [
            Text(
              stock.symbol,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                stock.exchange,
                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        subtitle: Text(
          stock.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 12, color: Colors.grey),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              CalculationService.formatMoney(stock.price),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
            ),
            const SizedBox(height: 2),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: changeColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                CalculationService.formatPercent(stock.percentChange),
                style: TextStyle(
                  color: changeColor,
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
