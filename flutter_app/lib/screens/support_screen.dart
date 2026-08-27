import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../config/app_theme.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({Key? key}) : super(key: key);

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  List<dynamic> _faqs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFaqs();
  }

  Future<void> _loadFaqs() async {
    try {
      final res = await ApiService.get('${ApiConfig.support}/faqs');
      if (res is List && mounted) {
        setState(() {
          _faqs = res;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & Customer Support')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Support Header Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Need assistance?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 4),
                      const Text('Our support desk is active 24/7 for simulated trading queries.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.email, color: Colors.black),
                        label: const Text('Open Support Ticket', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800)),
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.brandPrimary),
                        onPressed: () => _showTicketDialog(context),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                const Text('💡 Frequently Asked Questions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),

                ..._faqs.map((faq) => Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ExpansionTile(
                        title: Text(faq['question'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(faq['answer'] ?? '', style: const TextStyle(fontSize: 13, color: Colors.grey, height: 1.4)),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
    );
  }

  void _showTicketDialog(BuildContext context) {
    final subjController = TextEditingController();
    final descController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Support Ticket'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: subjController, decoration: const InputDecoration(labelText: 'Subject', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: descController, maxLines: 3, decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder())),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ApiService.post('${ApiConfig.support}/tickets', {
                'subject': subjController.text,
                'category': 'General',
                'description': descController.text,
              });
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Support ticket submitted.'), backgroundColor: AppTheme.gainGreen),
                );
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}
