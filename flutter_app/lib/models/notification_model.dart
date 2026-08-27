class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? json['text'] ?? '',
      type: json['type'] ?? 'SYSTEM',
      isRead: json['isRead'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class AlertModel {
  final String id;
  final String symbol;
  final String condition;
  final double targetValue;
  final double currentPrice;
  final String status;

  AlertModel({
    required this.id,
    required this.symbol,
    required this.condition,
    required this.targetValue,
    required this.currentPrice,
    required this.status,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    return AlertModel(
      id: json['id'] ?? '',
      symbol: json['symbol'] ?? '',
      condition: json['condition'] ?? 'PRICE_ABOVE',
      targetValue: (json['targetValue'] ?? 0.0).toDouble(),
      currentPrice: (json['currentPrice'] ?? 0.0).toDouble(),
      status: json['status'] ?? 'ACTIVE',
    );
  }
}
