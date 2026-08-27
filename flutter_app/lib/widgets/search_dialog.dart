import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../services/calculation_service.dart';
import '../screens/stock_detail_screen.dart';

class GlobalSearchDialog extends StatefulWidget {
  const GlobalSearchDialog({Key? key}) : super(key: key);

  static void show(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => const GlobalSearchDialog(),
    );
  }

  @override
  State<GlobalSearchDialog> createState() => _GlobalSearchDialogState();
}

class _GlobalSearchDialogState extends State<GlobalSearchDialog> {
  final TextEditingController _controller = TextEditingController();
  List<dynamic> _results = [];
  bool _isLoading = false;

  void _search(String query) async {
    if (query.trim().isEmpty) {
      setState(() => _results = []);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final res = await ApiService.get('${ApiConfig.search}?q=$query');
      if (res is Map && res['results'] is List) {
        setState(() {
          _results = res['results'];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Theme.of(context).cardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(16),
        constraints: const BoxConstraints(maxHeight: 480, maxWidth: 400),
        child: Column(
          children: [
            TextField(
              controller: _controller,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search stocks, mutual funds, indices...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _controller.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _controller.clear();
                          _search('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onChanged: _search,
            ),
            const SizedBox(height: 12),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _results.isEmpty
                      ? Center(
                          child: Text(
                            _controller.text.isEmpty ? 'Type to search Indian markets' : 'No results found',
                            style: const TextStyle(color: Colors.grey),
                          ),
                        )
                      : ListView.separated(
                          itemCount: _results.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final item = _results[index];
                            final type = item['type'] ?? 'STOCK';
                            return ListTile(
                              leading: CircleAvatar(
                                radius: 16,
                                backgroundColor: Colors.grey.withOpacity(0.2),
                                child: Text(
                                  type == 'MUTUAL_FUND' ? 'MF' : 'EQ',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
                                ),
                              ),
                              title: Text(item['symbol'] ?? item['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700)),
                              subtitle: Text(item['name'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                              trailing: item['price'] != null
                                  ? Text(
                                      CalculationService.formatMoney((item['price'] as num).toDouble()),
                                      style: const TextStyle(fontWeight: FontWeight.w700),
                                    )
                                  : null,
                              onTap: () {
                                Navigator.pop(context);
                                if (type == 'STOCK' && item['symbol'] != null) {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => StockDetailScreen(symbol: item['symbol'])),
                                  );
                                }
                              },
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
