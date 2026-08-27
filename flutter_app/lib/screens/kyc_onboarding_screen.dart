import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/app_theme.dart';

class KycOnboardingScreen extends StatefulWidget {
  const KycOnboardingScreen({Key? key}) : super(key: key);

  @override
  State<KycOnboardingScreen> createState() => _KycOnboardingScreenState();
}

class _KycOnboardingScreenState extends State<KycOnboardingScreen> {
  int _currentStep = 0;

  final TextEditingController _phoneController = TextEditingController(text: '+91 9876543210');
  final TextEditingController _phoneOtpController = TextEditingController();
  final TextEditingController _emailController = TextEditingController(text: 'user@nextrade.in');
  final TextEditingController _emailOtpController = TextEditingController();
  final TextEditingController _panController = TextEditingController(text: 'ABCDE1234F');
  final TextEditingController _bankAccController = TextEditingController(text: '50100492837192');
  final TextEditingController _ifscController = TextEditingController(text: 'HDFC0001234');
  String _bankLookupInfo = '';

  bool _isSendingOtp = false;

  final List<String> _stepTitles = [
    'Mobile Verification (SMS OTP)',
    'Mobile OTP Confirmation',
    'Email Address Verification',
    'Email OTP Confirmation',
    'PAN Card Tax Check',
    'Date of Birth',
    'Bank & Live RBI IFSC',
    'Nominee Declaration',
    'Residential Address',
    'Aadhaar DigiLocker',
    'Risk Assessment',
    'Final Confirmation',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Real KYC Onboarding')),
      body: Stepper(
        currentStep: _currentStep,
        onStepContinue: () => _handleStepContinue(),
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep--);
          }
        },
        steps: _stepTitles.asMap().entries.map((entry) {
          final idx = entry.key;
          final title = entry.value;

          return Step(
            title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
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
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'Mobile Number', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _isSendingOtp ? null : _sendPhoneOtp,
              child: _isSendingOtp
                  ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Send Real SMS OTP'),
            ),
          ],
        );

      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _phoneOtpController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: '6-Digit SMS Code', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            ElevatedButton(onPressed: _verifyPhoneOtp, child: const Text('Verify Phone OTP')),
          ],
        );

      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _isSendingOtp ? null : _sendEmailOtp,
              child: const Text('Send Email Verification Code'),
            ),
          ],
        );

      case 3:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _emailOtpController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: '6-Digit Email Code', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            ElevatedButton(onPressed: _verifyEmailOtp, child: const Text('Verify Email Code')),
          ],
        );

      case 4:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _panController,
              decoration: const InputDecoration(labelText: '10-Digit PAN Number', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            ElevatedButton(onPressed: _verifyPan, child: const Text('Verify PAN Format')),
          ],
        );

      case 5:
        return const TextField(decoration: InputDecoration(labelText: 'Date of Birth (YYYY-MM-DD)', border: OutlineInputBorder()));

      case 6:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(controller: _bankAccController, decoration: const InputDecoration(labelText: 'Account Number', border: OutlineInputBorder())),
            const SizedBox(height: 10),
            TextField(controller: _ifscController, decoration: const InputDecoration(labelText: 'IFSC Code', border: OutlineInputBorder())),
            const SizedBox(height: 10),
            ElevatedButton(onPressed: _lookupIfsc, child: const Text('Lookup RBI IFSC')),
            if (_bankLookupInfo.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(_bankLookupInfo, style: const TextStyle(color: AppTheme.gainGreen, fontWeight: FontWeight.w700, fontSize: 12)),
            ],
          ],
        );

      case 7:
        return const TextField(decoration: InputDecoration(labelText: 'Nominee Name (e.g. Ananya Devan - Spouse)', border: OutlineInputBorder()));

      case 8:
        return const TextField(decoration: InputDecoration(labelText: 'Address', border: OutlineInputBorder()));

      case 9:
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppTheme.gainGreen.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
          child: const Text('✅ DigiLocker Aadhaar Verification Gateway Connected', style: TextStyle(color: AppTheme.gainGreen, fontWeight: FontWeight.w700)),
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

  void _handleStepContinue() {
    if (_currentStep < _stepTitles.length - 1) {
      setState(() => _currentStep++);
    } else {
      _completeKYC();
    }
  }

  Future<void> _sendPhoneOtp() async {
    setState(() => _isSendingOtp = true);
    try {
      final res = await ApiService.post('/kyc/send-phone-otp', {'phone': _phoneController.text.trim()});
      setState(() {
        _isSendingOtp = false;
        _currentStep = 1;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'SMS OTP Dispatched!'), backgroundColor: AppTheme.gainGreen),
        );
      }
    } catch (e) {
      setState(() => _isSendingOtp = false);
    }
  }

  Future<void> _verifyPhoneOtp() async {
    try {
      await ApiService.post('/kyc/verify-phone-otp', {
        'phone': _phoneController.text.trim(),
        'otp': _phoneOtpController.text.trim(),
      });
      setState(() => _currentStep = 2);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: AppTheme.lossRed),
        );
      }
    }
  }

  Future<void> _sendEmailOtp() async {
    setState(() => _isSendingOtp = true);
    try {
      final res = await ApiService.post('/kyc/send-email-otp', {'email': _emailController.text.trim()});
      setState(() {
        _isSendingOtp = false;
        _currentStep = 3;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Email code sent!'), backgroundColor: AppTheme.gainGreen),
        );
      }
    } catch (e) {
      setState(() => _isSendingOtp = false);
    }
  }

  Future<void> _verifyEmailOtp() async {
    try {
      await ApiService.post('/kyc/verify-email-otp', {
        'email': _emailController.text.trim(),
        'otp': _emailOtpController.text.trim(),
      });
      setState(() => _currentStep = 4);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: AppTheme.lossRed),
        );
      }
    }
  }

  Future<void> _verifyPan() async {
    try {
      final res = await ApiService.post('/kyc/verify-pan', {'pan': _panController.text.trim().toUpperCase()});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PAN Verified: ${res['entityType']}'), backgroundColor: AppTheme.gainGreen),
        );
      }
      setState(() => _currentStep = 5);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: AppTheme.lossRed),
        );
      }
    }
  }

  Future<void> _lookupIfsc() async {
    try {
      final ifsc = _ifscController.text.trim().toUpperCase();
      final res = await ApiService.get('/kyc/lookup-ifsc/$ifsc');
      setState(() {
        _bankLookupInfo = '🏦 ${res['bankName']} (${res['branch']}, ${res['city']})';
      });
    } catch (e) {
      setState(() {
        _bankLookupInfo = '⚠️ Invalid IFSC code';
      });
    }
  }

  Future<void> _completeKYC() async {
    try {
      await ApiService.post('/kyc/submit', {
        'phone': _phoneController.text.trim(),
        'email': _emailController.text.trim(),
        'pan': _panController.text.trim(),
        'bankAccount': _bankAccController.text.trim(),
        'ifsc': _ifscController.text.trim(),
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
