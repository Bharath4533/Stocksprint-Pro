class HoldingModel {
  final String symbol;
  final String companyName;
  final int quantity;
  final double averageBuyPrice;
  final double currentPrice;
  final double investedValue;
  final double currentValue;
  final double unrealizedPnL;
  final double unrealizedPnLPercent;
  final double todayPnL;

  HoldingModel({
    required this.symbol,
    required this.companyName,
    required this.quantity,
    required this.averageBuyPrice,
    required this.currentPrice,
    required this.investedValue,
    required this.currentValue,
    required this.unrealizedPnL,
    required this.unrealizedPnLPercent,
    required this.todayPnL,
  });

  factory HoldingModel.fromJson(Map<String, dynamic> json) {
    return HoldingModel(
      symbol: json['symbol'] ?? '',
      companyName: json['companyName'] ?? json['symbol'] ?? '',
      quantity: (json['quantity'] ?? 0) is int ? json['quantity'] : (json['quantity'] ?? 0).toInt(),
      averageBuyPrice: (json['averageBuyPrice'] ?? 0.0).toDouble(),
      currentPrice: (json['currentPrice'] ?? 0.0).toDouble(),
      investedValue: (json['investedValue'] ?? 0.0).toDouble(),
      currentValue: (json['currentValue'] ?? 0.0).toDouble(),
      unrealizedPnL: (json['unrealizedPnL'] ?? 0.0).toDouble(),
      unrealizedPnLPercent: (json['unrealizedPnLPercent'] ?? 0.0).toDouble(),
      todayPnL: (json['todayPnL'] ?? 0.0).toDouble(),
    );
  }
}

class PositionModel {
  final String id;
  final String symbol;
  final String side;
  final int quantity;
  final double averagePrice;
  final double currentPrice;
  final double unrealizedPnL;
  final double realizedPnL;
  final String status;

  PositionModel({
    required this.id,
    required this.symbol,
    required this.side,
    required this.quantity,
    required this.averagePrice,
    required this.currentPrice,
    required this.unrealizedPnL,
    required this.realizedPnL,
    required this.status,
  });

  factory PositionModel.fromJson(Map<String, dynamic> json) {
    return PositionModel(
      id: json['id'] ?? '',
      symbol: json['symbol'] ?? '',
      side: json['side'] ?? 'BUY',
      quantity: (json['quantity'] ?? 0) is int ? json['quantity'] : (json['quantity'] ?? 0).toInt(),
      averagePrice: (json['averagePrice'] ?? 0.0).toDouble(),
      currentPrice: (json['currentPrice'] ?? 0.0).toDouble(),
      unrealizedPnL: (json['unrealizedPnL'] ?? 0.0).toDouble(),
      realizedPnL: (json['realizedPnL'] ?? 0.0).toDouble(),
      status: json['status'] ?? 'OPEN',
    );
  }
}

class PortfolioSummary {
  final double totalPortfolioValue;
  final double totalInvested;
  final double overallPnL;
  final double overallPnLPercent;
  final double todayPnL;
  final double availableCash;
  final double usedMargin;

  PortfolioSummary({
    required this.totalPortfolioValue,
    required this.totalInvested,
    required this.overallPnL,
    required this.overallPnLPercent,
    required this.todayPnL,
    required this.availableCash,
    required this.usedMargin,
  });

  factory PortfolioSummary.fromJson(Map<String, dynamic> json) {
    return PortfolioSummary(
      totalPortfolioValue: (json['totalPortfolioValue'] ?? 0.0).toDouble(),
      totalInvested: (json['totalInvested'] ?? 0.0).toDouble(),
      overallPnL: (json['overallPnL'] ?? 0.0).toDouble(),
      overallPnLPercent: (json['overallPnLPercent'] ?? 0.0).toDouble(),
      todayPnL: (json['todayPnL'] ?? 0.0).toDouble(),
      availableCash: (json['availableCash'] ?? 0.0).toDouble(),
      usedMargin: (json['usedMargin'] ?? 0.0).toDouble(),
    );
  }
}
