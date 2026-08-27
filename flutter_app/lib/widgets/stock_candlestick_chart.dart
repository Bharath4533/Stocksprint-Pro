import 'package:flutter/material.dart';
import '../models/stock_model.dart';
import '../services/calculation_service.dart';
import '../config/app_theme.dart';

class StockCandlestickChart extends StatefulWidget {
  final List<CandleModel> candles;
  final bool isCandlestick;
  final Function(String)? onTimeframeChanged;
  final String activeTimeframe;

  const StockCandlestickChart({
    Key? key,
    required this.candles,
    this.isCandlestick = true,
    this.onTimeframeChanged,
    this.activeTimeframe = '1D',
  }) : super(key: key);

  @override
  State<StockCandlestickChart> createState() => _StockCandlestickChartState();
}

class _StockCandlestickChartState extends State<StockCandlestickChart> {
  int? _hoverIndex;

  @override
  Widget build(BuildContext context) {
    if (widget.candles.isEmpty) {
      return Container(
        height: 260,
        alignment: Alignment.center,
        child: const Text('Loading candlestick chart...', style: TextStyle(color: Colors.grey)),
      );
    }

    final hoveredCandle = _hoverIndex != null && _hoverIndex! < widget.candles.length
        ? widget.candles[_hoverIndex!]
        : widget.candles.last;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Real-time OHLCV Inspection Header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor.withOpacity(0.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildOhlcItem('O', hoveredCandle.open),
              _buildOhlcItem('H', hoveredCandle.high),
              _buildOhlcItem('L', hoveredCandle.low),
              _buildOhlcItem('C', hoveredCandle.close),
              _buildOhlcItem('Vol', hoveredCandle.volume.toDouble(), isVolume: true),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // Interactive Canvas Chart
        SizedBox(
          height: 220,
          child: GestureDetector(
            onHorizontalDragUpdate: (details) => _handleTouch(details.localPosition),
            onTapDown: (details) => _handleTouch(details.localPosition),
            onTapUp: (_) => setState(() => _hoverIndex = null),
            child: CustomPaint(
              size: const Size(double.infinity, 220),
              painter: _CandlePainter(
                candles: widget.candles,
                isCandlestick: widget.isCandlestick,
                hoverIndex: _hoverIndex,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Timeframe Selector Chips
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'].map((tf) {
            final isSelected = widget.activeTimeframe == tf;
            return GestureDetector(
              onTap: () => widget.onTimeframeChanged?.call(tf),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.brandPrimary : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  tf,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? Colors.black : Colors.grey,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildOhlcItem(String label, double value, {bool isVolume = false}) {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(text: '$label: ', style: const TextStyle(fontSize: 11, color: Colors.grey)),
          TextSpan(
            text: isVolume ? CalculationService.formatNumber(value.toInt()) : '₹${value.toStringAsFixed(2)}',
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
          ),
        ],
      ),
    );
  }

  void _handleTouch(Offset localPosition) {
    if (widget.candles.isEmpty) return;
    final RenderBox renderBox = context.findRenderObject() as RenderBox;
    final width = renderBox.size.width;
    final candleWidth = width / widget.candles.length;
    final index = (localPosition.dx / candleWidth).clamp(0, widget.candles.length - 1).toInt();
    setState(() {
      _hoverIndex = index;
    });
  }
}

class _CandlePainter extends CustomPainter {
  final List<CandleModel> candles;
  final bool isCandlestick;
  final int? hoverIndex;

  _CandlePainter({
    required this.candles,
    required this.isCandlestick,
    this.hoverIndex,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (candles.isEmpty) return;

    double minPrice = candles.map((c) => c.low).reduce((a, b) => a < b ? a : b);
    double maxPrice = candles.map((c) => c.high).reduce((a, b) => a > b ? a : b);
    final maxVol = candles.map((c) => c.volume).reduce((a, b) => a > b ? a : b);

    if (minPrice == maxPrice) {
      minPrice *= 0.95;
      maxPrice *= 1.05;
    }

    final priceRange = maxPrice - minPrice;
    final candleWidth = size.width / candles.length;

    final gainPaint = Paint()..color = AppTheme.gainGreen;
    final lossPaint = Paint()..color = AppTheme.lossRed;
    final linePaint = Paint()
      ..color = AppTheme.brandPrimary
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final volumePaint = Paint()..color = Colors.grey.withOpacity(0.2);

    final linePath = Path();

    // 1. Draw Volume Bars
    for (int i = 0; i < candles.length; i++) {
      final c = candles[i];
      final x = i * candleWidth + candleWidth / 2;
      final volHeight = (c.volume / (maxVol == 0 ? 1 : maxVol)) * (size.height * 0.25);
      final volRect = Rect.fromLTWH(
        x - (candleWidth * 0.35),
        size.height - volHeight,
        candleWidth * 0.7,
        volHeight,
      );
      canvas.drawRect(volRect, volumePaint);
    }

    // 2. Draw Candlesticks or Line
    for (int i = 0; i < candles.length; i++) {
      final c = candles[i];
      final isUp = c.close >= c.open;
      final paint = isUp ? gainPaint : lossPaint;

      final x = i * candleWidth + candleWidth / 2;
      final openY = size.height - ((c.open - minPrice) / priceRange) * (size.height * 0.85) - (size.height * 0.1);
      final closeY = size.height - ((c.close - minPrice) / priceRange) * (size.height * 0.85) - (size.height * 0.1);
      final highY = size.height - ((c.high - minPrice) / priceRange) * (size.height * 0.85) - (size.height * 0.1);
      final lowY = size.height - ((c.low - minPrice) / priceRange) * (size.height * 0.85) - (size.height * 0.1);

      if (isCandlestick) {
        // High-Low Wick
        canvas.drawLine(Offset(x, highY), Offset(x, lowY), paint..strokeWidth = 1.2);

        // Body
        final top = openY < closeY ? openY : closeY;
        final height = (openY - closeY).abs().clamp(2.0, size.height);
        final bodyRect = Rect.fromLTWH(x - (candleWidth * 0.35), top, candleWidth * 0.7, height);
        canvas.drawRect(bodyRect, paint);
      } else {
        if (i == 0) {
          linePath.moveTo(x, closeY);
        } else {
          linePath.lineTo(x, closeY);
        }
      }
    }

    if (!isCandlestick) {
      canvas.drawPath(linePath, linePaint);
    }

    // 3. Draw Crosshair on Hover/Touch
    if (hoverIndex != null && hoverIndex! < candles.length) {
      final hX = hoverIndex! * candleWidth + candleWidth / 2;
      final crossPaint = Paint()
        ..color = Colors.white.withOpacity(0.5)
        ..strokeWidth = 1.0
        ..style = PaintingStyle.stroke;

      canvas.drawLine(Offset(hX, 0), Offset(hX, size.height), crossPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _CandlePainter oldDelegate) => true;
}
