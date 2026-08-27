import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  static String? _token;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }

  static Future<void> setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString('auth_token', token);
    } else {
      await prefs.remove('auth_token');
    }
  }

  static String? get token => _token;

  static Map<String, String> _headers() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'x-allow-demo': 'true',
    };
    if (_token != null && _token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  static Future<dynamic> get(String endpoint) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final response = await http.get(uri, headers: _headers()).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static Future<dynamic> post(String endpoint, [Map<String, dynamic>? body]) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final response = await http
        .post(uri, headers: _headers(), body: body != null ? jsonEncode(body) : null)
        .timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static Future<dynamic> patch(String endpoint, [Map<String, dynamic>? body]) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final response = await http
        .patch(uri, headers: _headers(), body: body != null ? jsonEncode(body) : null)
        .timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static Future<dynamic> delete(String endpoint) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final response = await http.delete(uri, headers: _headers()).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  static dynamic _handleResponse(http.Response response) {
    if (response.body.isEmpty) return null;
    final dynamic body = jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else {
      final errorMessage = (body is Map && body.containsKey('error'))
          ? body['error']
          : 'Server returned error ${response.statusCode}';
      throw Exception(errorMessage);
    }
  }
}
