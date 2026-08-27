class StockModel {
  final String symbol;
  final String name;
  final String exchange;
  final String sector;
  final double price;
  final double change;
  final double percentChange;
  final double open;
  final double high;
  final double low;
  final double close;
  final int volume;
  final double marketCap;
  final Map<String, dynamic>? fundamentals;
  final Map<String, dynamic>? financials;

  StockModel({
    required this.symbol,
    required this.name,
    required this.exchange,
    required this.sector,
    required this.price,
    required this.change,
    required this.percentChange,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
    required this.marketCap,
    this.fundamentals,
    this.financials,
  });

  factory StockModel.fromJson(Map<String, dynamic> json) {
    return StockModel(
      symbol: json['symbol'] ?? '',
      name: json['name'] ?? '',
      exchange: json['exchange'] ?? 'NSE',
      sector: json['sector'] ?? '',
      price: (json['price'] ?? 0.0).toDouble(),
      change: (json['change'] ?? 0.0).toDouble(),
      percentChange: (json['percentChange'] ?? 0.0).toDouble(),
      open: (json['open'] ?? json['price'] ?? 0.0).toDouble(),
      high: (json['high'] ?? json['price'] ?? 0.0).toDouble(),
      low: (json['low'] ?? json['price'] ?? 0.0).toDouble(),
      close: (json['close'] ?? json['price'] ?? 0.0).toDouble(),
      volume: (json['volume'] ?? 0) is int ? json['volume'] : (json['volume'] ?? 0).toInt(),
      marketCap: (json['marketCap'] ?? 0.0).toDouble(),
      fundamentals: json['fundamentals'] is Map<String, dynamic> ? json['fundamentals'] : null,
      financials: json['financials'] is Map<String, dynamic> ? json['financials'] : null,
    );
  }
}

class IndexModel {
  final String symbol;
  final String name;
  final double value;
  final double change;
  final double percentChange;

  IndexModel({
    required this.symbol,
    required this.name,
    required this.value,
    required this.change,
    required this.percentChange,
  });

  factory IndexModel.fromJson(Map<String, dynamic> json) {
    return IndexModel(
      symbol: json['symbol'] ?? '',
      name: json['name'] ?? '',
      value: (json['value'] ?? 0.0).toDouble(),
      change: (json['change'] ?? 0.0).toDouble(),
      percentChange: (json['percentChange'] ?? 0.0).toDouble(),
    );
  }
}

class CandleModel {
  final DateTime time;
  final double open;
  final double high;
  final double low;
  final double close;
  final int volume;

  CandleModel({
    required this.time,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
  });

  factory CandleModel.fromJson(Map<String, dynamic> json) {
    return CandleModel(
      time: DateTime.tryParse(json['time']?.toString() ?? '') ?? DateTime.now(),
      open: (json['open'] ?? 0.0).toDouble(),
      high: (json['high'] ?? 0.0).toDouble(),
      low: (json['low'] ?? 0.0).toDouble(),
      close: (json['close'] ?? 0.0).toDouble(),
      volume: (json['volume'] ?? 0) is int ? json['volume'] : (json['volume'] ?? 0).toInt(),
    );
  }
}
