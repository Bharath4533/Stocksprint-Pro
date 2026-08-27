class IpoModel {
  final String id;
  final String company;
  final String symbol;
  final String priceBand;
  final int lotSize;
  final String issueSize;
  final String openDate;
  final String closeDate;
  final String listingDate;
  final String status; // OPEN, UPCOMING, LISTED
  final String? gmp;
  final double minInvestment;
  final String description;

  IpoModel({
    required this.id,
    required this.company,
    required this.symbol,
    required this.priceBand,
    required this.lotSize,
    required this.issueSize,
    required this.openDate,
    required this.closeDate,
    required this.listingDate,
    required this.status,
    this.gmp,
    required this.minInvestment,
    required this.description,
  });

  factory IpoModel.fromJson(Map<String, dynamic> json) {
    return IpoModel(
      id: json['id'] ?? '',
      company: json['company'] ?? '',
      symbol: json['symbol'] ?? '',
      priceBand: json['priceBand'] ?? '',
      lotSize: (json['lotSize'] ?? 1) is int ? json['lotSize'] : (json['lotSize'] ?? 1).toInt(),
      issueSize: json['issueSize'] ?? '',
      openDate: json['openDate'] ?? '',
      closeDate: json['closeDate'] ?? '',
      listingDate: json['listingDate'] ?? '',
      status: json['status'] ?? 'OPEN',
      gmp: json['gmp'],
      minInvestment: (json['minInvestment'] ?? 0.0).toDouble(),
      description: json['description'] ?? '',
    );
  }
}
