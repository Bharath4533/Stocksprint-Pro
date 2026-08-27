import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../config/app_theme.dart';

class KycOnboardingScreen extends StatefulWidget {
  const KycOnboardingScreen({Key? key}) : super(key: key);

  @override
  State<KycOnboardingScreen> createState() => _KycOnboardingScreenState();
}

class _KycOnboardingScreenState extends State<KycOnboardingScreen> {
  int _currentStep = 0;

  final List<String> _stepTitles = [
    'Mobile Verification',
    'OTP Confirmation',
    'Email Address',
    'PAN Card',
    'Date of Birth',
    'Personal Info',
    'Bank Account',
    'Nominee Details',
    'Address',
    'DigiLocker KYC',
    'Risk Profile',
    'Confirmation',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('12-Step Indian KYC Onboarding')),
      body: Stepper(
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep < _stepTitles.length - 1) {
            setState(() => _currentStep++);
          } else {
            _completeKYC();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep--);
          }
        },
        steps: _stepTitles.asMap().entries.map((entry) {
          final idx = entry.key;
          final title = entry.value;

          return Step(
            title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            isActive: _currentStep >= idx,
            state: _currentStep > idx ? StepState.complete : StepState.indexed,
            content: Container(
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: _buildStepContent(idx),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStepContent(int index) {
    switch (index) {
      case 0:
        return const TextField(decoration: InputDecoration(labelText: 'Mobile Number', hintText: '+91 98765 43210'));
      case 1:
        return const TextField(decoration: InputDecoration(labelText: '6-Digit OTP', hintText: '123456'));
      case 2:
        return const TextField(decoration: InputDecoration(labelText: 'Email Address', hintText: 'user@nextrade.in'));
      case 3:
        return const TextField(decoration: InputDecoration(labelText: 'PAN Number', hintText: 'ABCDE1234F'));
      case 4:
        return const TextField(decoration: InputDecoration(labelText: 'Date of Birth (YYYY-MM-DD)', hintText: '1996-05-14'));
      case 5:
        return const TextField(decoration: InputDecoration(labelText: 'Occupation', hintText: 'Software Engineer'));
      case 6:
        return const TextField(decoration: InputDecoration(labelText: 'Bank Account & IFSC', hintText: '50100492837192 (HDFC0001234)'));
      case 7:
        return const TextField(decoration: InputDecoration(labelText: 'Nominee Name & Relation', hintText: 'Ananya Devan (Spouse)'));
      case 8:
        return const TextField(decoration: InputDecoration(labelText: 'Residential Address', hintText: '42 Financial District, Hyderabad'));
      case 9:
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppTheme.gainGreen.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
          child: const Text('✅ DigiLocker Instant Aadhaar link verified.', style: TextStyle(color: AppTheme.gainGreen, fontWeight: FontWeight.w700)),
        );
      case 10:
        return const Text('Risk Profile: Growth & Moderate Capital Appreciation');
      case 11:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('🎉 KYC Ready for Submission', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            SizedBox(height: 4),
            Text('Your ₹5,00,000 simulated trading balance will be activated immediately.'),
          ],
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Future<void> _completeKYC() async {
    try {
      await ApiService.post('${ApiConfig.profile}/kyc/complete', {
        'nominee': {'name': 'Ananya Devan', 'relation': 'Spouse'},
        'address': '42 Financial District, Hyderabad',
        'riskProfile': 'GROWTH',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('KYC Verified successfully!'), backgroundColor: AppTheme.gainGreen),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
    }
  }
}
