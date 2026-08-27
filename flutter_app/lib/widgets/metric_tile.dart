import 'package:flutter/material.dart';

class MetricTile extends StatelessWidget {
  final String label;
  final String value;
  final String? subtitle;
  final Color? valueColor;

  const MetricTile({
    Key? key,
    required this.label,
    required this.value,
    this.subtitle,
    this.valueColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: valueColor ?? Theme.of(context).colorScheme.onSurface,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(subtitle!, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ],
      ),
    );
  }
}
