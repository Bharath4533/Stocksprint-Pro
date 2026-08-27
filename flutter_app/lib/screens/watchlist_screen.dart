import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/watchlist_provider.dart';
import '../widgets/stock_card.dart';
import '../widgets/search_dialog.dart';

class WatchlistScreen extends StatelessWidget {
  const WatchlistScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final watchlist = context.watch<WatchlistProvider>();
    final activeFolder = watchlist.activeFolder;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => watchlist.loadWatchlists(),
        child: Column(
          children: [
            // Watchlist Folder Selector & Add Folder Action
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: watchlist.folders.map((f) {
                          final isSelected = f.id == watchlist.activeFolderId;
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: ChoiceChip(
                              label: Text('${f.name} (${f.stocks.length})'),
                              selected: isSelected,
                              onSelected: (_) => watchlist.setActiveFolder(f.id),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline),
                    tooltip: 'New Folder',
                    onPressed: () => _showCreateFolderDialog(context),
                  ),
                  IconButton(
                    icon: const Icon(Icons.search),
                    tooltip: 'Add Scrip',
                    onPressed: () => GlobalSearchDialog.show(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Watchlist Stocks List
            Expanded(
              child: activeFolder == null || activeFolder.stocks.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.bookmark_border, size: 48, color: Colors.grey),
                          const SizedBox(height: 12),
                          const Text('Watchlist is empty', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 6),
                          const Text('Search and add stocks to track live ticks', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            icon: const Icon(Icons.search),
                            label: const Text('Add Stocks'),
                            onPressed: () => GlobalSearchDialog.show(context),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: activeFolder.stocks.length,
                      itemBuilder: (context, index) {
                        final stock = activeFolder.stocks[index];
                        return Dismissible(
                          key: Key('${activeFolder.id}_${stock.symbol}'),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 20),
                            color: Colors.red,
                            child: const Icon(Icons.delete, color: Colors.white),
                          ),
                          onDismissed: (_) {
                            watchlist.removeSymbol(activeFolder.id, stock.symbol);
                          },
                          child: StockCardTile(stock: stock),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateFolderDialog(BuildContext context) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Watchlist Folder'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'e.g. High Growth, Dividend'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final name = controller.text.trim();
              if (name.isNotEmpty) {
                await context.read<WatchlistProvider>().createFolder(name);
                if (ctx.mounted) Navigator.pop(ctx);
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}
