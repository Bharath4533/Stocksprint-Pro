import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;
  ThemeMode _themeMode = ThemeMode.dark;

  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  ThemeMode get themeMode => _themeMode;

  void toggleTheme() {
    _themeMode = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
  }

  Future<bool> initSession() async {
    _isLoading = true;
    notifyListeners();

    try {
      await ApiService.init();
      if (ApiService.token != null) {
        final res = await ApiService.get(ApiConfig.me);
        if (res != null && res['user'] != null) {
          _user = UserModel.fromJson(res['user']);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }
      // Auto-fallback to instant demo login
      return await loginDemo();
    } catch (e) {
      return await loginDemo();
    }
  }

  Future<bool> loginDemo() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService.post(ApiConfig.demoAuth);
      if (res != null && res['token'] != null) {
        await ApiService.setToken(res['token']);
        _user = UserModel.fromJson(res['user']);
        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw Exception('Invalid demo login response');
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService.post(ApiConfig.login, {
        'email': email,
        'password': password,
      });
      if (res != null && res['token'] != null) {
        await ApiService.setToken(res['token']);
        _user = UserModel.fromJson(res['user']);
        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw Exception('Invalid login response');
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await ApiService.setToken(null);
    _user = null;
    notifyListeners();
  }
}
