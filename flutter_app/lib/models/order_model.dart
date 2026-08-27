class OrderModel {
  final String id;
  final String userId;
  final String symbol;
  final String exchange;
  final String side; // BUY, SELL
  final String orderType; // MARKET, LIMIT, SL, SL_M
  final String productType; // CNC, MIS
  final int quantity;
  final double price;
  final double triggerPrice;
  final double charges;
  final String status; // FILLED, OPEN, REJECTED, CANCELLED
  final DateTime createdAt;

  OrderModel({
    required this.id,
    required this.userId,
    required this.symbol,
    required this.exchange,
    required this.side,
    required this.orderType,
    required this.productType,
    required this.quantity,
    required this.price,
    required this.triggerPrice,
    required this.charges,
    required this.status,
    required this.createdAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      symbol: json['symbol'] ?? '',
      exchange: json['exchange'] ?? 'NSE',
      side: json['side'] ?? 'BUY',
      orderType: json['orderType'] ?? 'MARKET',
      productType: json['productType'] ?? 'CNC',
      quantity: (json['quantity'] ?? 1) is int ? json['quantity'] : (json['quantity'] ?? 1).toInt(),
      price: (json['price'] ?? 0.0).toDouble(),
      triggerPrice: (json['triggerPrice'] ?? 0.0).toDouble(),
      charges: (json['charges'] ?? 0.0).toDouble(),
      status: json['status'] ?? 'FILLED',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class ChargesBreakdown {
  final double turnover;
  final double brokerage;
  final double stt;
  final double exchangeCharges;
  final double sebiCharges;
  final double gst;
  final double stampDuty;
  final double dpCharges;
  final double totalCharges;

  ChargesBreakdown({
    required this.turnover,
    required this.brokerage,
    required this.stt,
    required this.exchangeCharges,
    required this.sebiCharges,
    required this.gst,
    required this.stampDuty,
    required this.dpCharges,
    required this.totalCharges,
  });

  factory ChargesBreakdown.fromJson(Map<String, dynamic> json) {
    return ChargesBreakdown(
      turnover: (json['turnover'] ?? 0.0).toDouble(),
      brokerage: (json['brokerage'] ?? 0.0).toDouble(),
      stt: (json['stt'] ?? 0.0).toDouble(),
      exchangeCharges: (json['exchangeCharges'] ?? 0.0).toDouble(),
      sebiCharges: (json['sebiCharges'] ?? 0.0).toDouble(),
      gst: (json['gst'] ?? 0.0).toDouble(),
      stampDuty: (json['stampDuty'] ?? 0.0).toDouble(),
      dpCharges: (json['dpCharges'] ?? 0.0).toDouble(),
      totalCharges: (json['totalCharges'] ?? 0.0).toDouble(),
    );
  }
}
