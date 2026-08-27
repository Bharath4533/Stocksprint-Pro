class MutualFundModel {
  final String id;
  final String name;
  final String category;
  final double nav;
  final String returns1Y;
  final String returns3Y;
  final String returns5Y;
  final String aum;
  final String expenseRatio;
  final double minSipAmount;
  final List<String> topHoldings;

  MutualFundModel({
    required this.id,
    required this.name,
    required this.category,
    required this.nav,
    required this.returns1Y,
    required this.returns3Y,
    required this.returns5Y,
    required this.aum,
    required this.expenseRatio,
    required this.minSipAmount,
    required this.topHoldings,
  });

  factory MutualFundModel.fromJson(Map<String, dynamic> json) {
    return MutualFundModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? '',
      nav: (json['nav'] ?? 0.0).toDouble(),
      returns1Y: json['returns1Y'] ?? '',
      returns3Y: json['returns3Y'] ?? '',
      returns5Y: json['returns5Y'] ?? '',
      aum: json['aum'] ?? '',
      expenseRatio: json['expenseRatio'] ?? '',
      minSipAmount: (json['minSipAmount'] ?? 500.0).toDouble(),
      topHoldings: (json['topHoldings'] is List)
          ? List<String>.from(json['topHoldings'].map((e) => e.toString()))
          : [],
    );
  }
}
