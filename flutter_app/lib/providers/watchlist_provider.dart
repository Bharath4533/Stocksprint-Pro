import 'package:flutter/material.dart';
import '../models/stock_model.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

class WatchlistFolder {
  final String id;
  final String name;
  final List<StockModel> stocks;

  WatchlistFolder({
    required this.id,
    required this.name,
    required this.stocks,
  });

  factory WatchlistFolder.fromJson(Map<String, dynamic> json) {
    return WatchlistFolder(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      stocks: (json['stocks'] is List)
          ? (json['stocks'] as List).map((s) => StockModel.fromJson(s)).toList()
          : [],
    );
  }
}

class WatchlistProvider with ChangeNotifier {
  List<WatchlistFolder> _folders = [];
  String? _activeFolderId;
  bool _isLoading = false;

  List<WatchlistFolder> get folders => _folders;
  String? get activeFolderId => _activeFolderId;
  bool get isLoading => _isLoading;

  WatchlistFolder? get activeFolder {
    if (_folders.isEmpty) return null;
    return _folders.firstWhere(
      (f) => f.id == _activeFolderId,
      orElse: () => _folders.first,
    );
  }

  void setActiveFolder(String id) {
    _activeFolderId = id;
    notifyListeners();
  }

  Future<void> loadWatchlists() async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConfig.watchlists);
      if (res is List) {
        _folders = res.map((w) => WatchlistFolder.fromJson(w)).toList();
        if (_activeFolderId == null && _folders.isNotEmpty) {
          _activeFolderId = _folders.first.id;
        }
      }
    } catch (e) {
      debugPrint('Error loading watchlists: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createFolder(String name) async {
    try {
      final res = await ApiService.post(ApiConfig.watchlists, {'name': name});
      if (res != null) {
        await loadWatchlists();
        return true;
      }
    } catch (e) {
      rethrow;
    }
    return false;
  }

  Future<bool> addSymbolToWatchlist(String folderId, String symbol) async {
    try {
      await ApiService.post('${ApiConfig.watchlists}/$folderId/symbols', {'symbol': symbol});
      await loadWatchlists();
      return true;
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> removeSymbol(String folderId, String symbol) async {
    try {
      await ApiService.delete('${ApiConfig.watchlists}/$folderId/symbols/$symbol');
      await loadWatchlists();
      return true;
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> deleteFolder(String folderId) async {
    try {
      await ApiService.delete('${ApiConfig.watchlists}/$folderId');
      _activeFolderId = null;
      await loadWatchlists();
      return true;
    } catch (e) {
      rethrow;
    }
  }
}
