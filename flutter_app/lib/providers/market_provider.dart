import 'package:flutter/material.dart';
import '../models/stock_model.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

class MarketProvider with ChangeNotifier {
  List<IndexModel> _indices = [];
  List<StockModel> _stocks = [];
  List<StockModel> _gainers = [];
  List<StockModel> _losers = [];
  bool _isLoading = false;
  String _activeTimeframe = '1D';
  List<CandleModel> _activeCandles = [];

  List<IndexModel> get indices => _indices;
  List<StockModel> get stocks => _stocks;
  List<StockModel> get gainers => _gainers;
  List<StockModel> get losers => _losers;
  bool get isLoading => _isLoading;
  String get activeTimeframe => _activeTimeframe;
  List<CandleModel> get activeCandles => _activeCandles;

  Future<void> loadMarketOverview() async {
    _isLoading = true;
    notifyListeners();

    try {
      final futures = await Future.wait([
        ApiService.get(ApiConfig.indices),
        ApiService.get(ApiConfig.stocks),
        ApiService.get(ApiConfig.movers),
      ]);

      if (futures[0] is List) {
        _indices = (futures[0] as List).map((i) => IndexModel.fromJson(i)).toList();
      }

      if (futures[1] is List) {
        _stocks = (futures[1] as List).map((s) => StockModel.fromJson(s)).toList();
      }

      if (futures[2] is Map) {
        final movers = futures[2] as Map<String, dynamic>;
        if (movers['gainers'] is List) {
          _gainers = (movers['gainers'] as List).map((g) => StockModel.fromJson(g)).toList();
        }
        if (movers['losers'] is List) {
          _losers = (movers['losers'] as List).map((l) => StockModel.fromJson(l)).toList();
        }
      }
    } catch (e) {
      debugPrint('Error loading market overview: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<StockModel?> getStockDetail(String symbol) async {
    try {
      final res = await ApiService.get('${ApiConfig.stocks}/$symbol');
      if (res is Map<String, dynamic>) {
        return StockModel.fromJson(res);
      }
    } catch (e) {
      debugPrint('Error fetching stock detail: $e');
    }
    return null;
  }

  Future<void> loadCandles(String symbol, [String timeframe = '1D']) async {
    _activeTimeframe = timeframe;
    try {
      final res = await ApiService.get('${ApiConfig.stocks}/$symbol/chart?range=$timeframe');
      if (res is Map && res['candles'] is List) {
        _activeCandles = (res['candles'] as List).map((c) => CandleModel.fromJson(c)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching candles: $e');
    }
  }
}
