import 'package:intl/intl.dart';

class CalculationService {
  static final NumberFormat _inrFormatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  static final NumberFormat _inrCompact = NumberFormat.compactCurrency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  static String formatMoney(double amount, {bool compact = false}) {
    if (compact && amount.abs() >= 100000) {
      if (amount.abs() >= 10000000) {
        return '₹${(amount / 10000000).toStringAsFixed(2)} Cr';
      }
      return '₹${(amount / 100000).toStringAsFixed(2)} L';
    }
    return _inrFormatter.format(amount);
  }

  static String formatPercent(double percent) {
    final sign = percent >= 0 ? '+' : '';
    return '$sign${percent.toStringAsFixed(2)}%';
  }

  static String formatNumber(num number) {
    return NumberFormat.decimalPattern('en_IN').format(number);
  }

  // Live client-side Indian charges estimator
  static Map<String, double> calculateCharges({
    required String productType, // CNC or MIS
    required String side, // BUY or SELL
    required double price,
    required int quantity,
  }) {
    final turnover = price * quantity;
    final isDelivery = productType.toUpperCase() == 'CNC';
    final isBuy = side.toUpperCase() == 'BUY';

    // 1. Brokerage
    double brokerage = 0.0;
    if (!isDelivery) {
      brokerage = turnover * 0.0003;
      if (brokerage > 20.0) brokerage = 20.0;
    }

    // 2. STT
    double stt = 0.0;
    if (isDelivery) {
      stt = turnover * 0.001; // 0.1% on both Buy and Sell
    } else {
      if (!isBuy) {
        stt = turnover * 0.00025; // 0.025% on Sell only
      }
    }

    // 3. Exchange Turnover (0.00345%)
    final exchangeCharges = turnover * 0.0000345;

    // 4. SEBI Charges (₹10 / Crore)
    final sebiCharges = turnover * 0.000001;

    // 5. GST (18% on Brokerage + Exchange + SEBI)
    final gst = (brokerage + exchangeCharges + sebiCharges) * 0.18;

    // 6. Stamp Duty (on BUY side only)
    double stampDuty = 0.0;
    if (isBuy) {
      stampDuty = isDelivery ? turnover * 0.00015 : turnover * 0.00003;
    }

    // 7. DP Charges (₹15.93 on Delivery SELL only)
    double dpCharges = 0.0;
    if (isDelivery && !isBuy) {
      dpCharges = 15.93;
    }

    final totalCharges = brokerage + stt + exchangeCharges + sebiCharges + gst + stampDuty + dpCharges;

    return {
      'turnover': turnover,
      'brokerage': brokerage,
      'stt': stt,
      'exchangeCharges': exchangeCharges,
      'sebiCharges': sebiCharges,
      'gst': gst,
      'stampDuty': stampDuty,
      'dpCharges': dpCharges,
      'totalCharges': totalCharges,
    };
  }

  // SIP Compound Returns Calculation
  static Map<String, dynamic> calculateSIPProjection({
    required double monthlyAmount,
    required double annualRate,
    required int years,
  }) {
    final months = years * 12;
    final monthlyRate = (annualRate / 100) / 12;
    final totalInvested = monthlyAmount * months;

    double futureValue = 0.0;
    if (monthlyRate == 0) {
      futureValue = totalInvested;
    } else {
      futureValue = monthlyAmount *
          ((((1 + monthlyRate) * (MathHelper.pow(1 + monthlyRate, months) - 1)) / monthlyRate));
    }

    final wealthGain = futureValue - totalInvested;

    return {
      'totalInvested': totalInvested,
      'projectedFutureValue': futureValue,
      'estimatedWealthGain': wealthGain,
    };
  }
}

class MathHelper {
  static double pow(double base, int exponent) {
    double result = 1.0;
    for (int i = 0; i < exponent; i++) {
      result *= base;
    }
    return result;
  }
}
