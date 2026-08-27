class ApiConfig {
  // Use http://localhost:3000 for iOS Simulator & Web / Desktop
  // Use http://10.0.2.2:3000 for Android Emulator
  static String baseUrl = 'http://localhost:3000/api';

  static const String demoAuth = '/auth/demo';
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';

  static const String indices = '/markets/indices';
  static const String search = '/markets/search';
  static const String movers = '/markets/movers';
  static const String news = '/markets/news';

  static const String stocks = '/stocks';
  static const String watchlists = '/watchlists';
  static const String orders = '/orders';
  static const String orderEstimate = '/orders/estimate';
  static const String portfolio = '/portfolio';
  static const String funds = '/funds';
  static const String mutualFunds = '/mutual-funds';
  static const String sipCalculator = '/mutual-funds/calculator';
  static const String ipos = '/ipos';
  static const String alerts = '/alerts';
  static const String notifications = '/notifications';
  static const String profile = '/profile';
  static const String support = '/support';
  static const String admin = '/admin';
}
