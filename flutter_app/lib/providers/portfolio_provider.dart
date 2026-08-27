import 'package:flutter/material.dart';
import '../models/portfolio_model.dart';
import '../models/order_model.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

class PortfolioProvider with ChangeNotifier {
  PortfolioSummary? _summary;
  List<HoldingModel> _holdings = [];
  List<PositionModel> _positions = [];
  List<OrderModel> _executedOrders = [];
  List<OrderModel> _openOrders = [];
  bool _isLoading = false;

  PortfolioSummary? get summary => _summary;
  List<HoldingModel> get holdings => _holdings;
  List<PositionModel> get positions => _positions;
  List<OrderModel> get executedOrders => _executedOrders;
  List<OrderModel> get openOrders => _openOrders;
  bool get isLoading => _isLoading;

  Future<void> loadPortfolio() async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConfig.portfolio);
      if (res is Map<String, dynamic>) {
        if (res['summary'] is Map<String, dynamic>) {
          _summary = PortfolioSummary.fromJson(res['summary']);
        }
        if (res['holdings'] is List) {
          _holdings = (res['holdings'] as List).map((h) => HoldingModel.fromJson(h)).toList();
        }
        if (res['positions'] is List) {
          _positions = (res['positions'] as List).map((p) => PositionModel.fromJson(p)).toList();
        }
      }
    } catch (e) {
      debugPrint('Error loading portfolio: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadOrders() async {
    try {
      final res = await ApiService.get(ApiConfig.orders);
      if (res is Map<String, dynamic>) {
        if (res['executed'] is List) {
          _executedOrders = (res['executed'] as List).map((o) => OrderModel.fromJson(o)).toList();
        }
        if (res['open'] is List) {
          _openOrders = (res['open'] as List).map((o) => OrderModel.fromJson(o)).toList();
        }
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error loading orders: $e');
    }
  }

  Future<bool> placeOrder({
    required String symbol,
    required String side,
    required String orderType,
    required String productType,
    required int quantity,
    required double price,
    double triggerPrice = 0.0,
  }) async {
    try {
      final res = await ApiService.post(ApiConfig.orders, {
        'symbol': symbol,
        'side': side,
        'orderType': orderType,
        'productType': productType,
        'quantity': quantity,
        'price': price,
        'triggerPrice': triggerPrice,
      });

      if (res != null) {
        await loadPortfolio();
        await loadOrders();
        return true;
      }
    } catch (e) {
      rethrow;
    }
    return false;
  }

  Future<bool> squareOffPosition(String positionId) async {
    try {
      await ApiService.post('${ApiConfig.portfolio}/positions/$positionId/square-off');
      await loadPortfolio();
      return true;
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> cancelOrder(String orderId) async {
    try {
      await ApiService.delete('${ApiConfig.orders}/$orderId');
      await loadOrders();
      return true;
    } catch (e) {
      rethrow;
    }
  }
}
