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

  // Blank initial controllers - user must enter their real details
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _phoneOtpController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _emailOtpController = TextEditingController();
  final TextEditingController _panController = TextEditingController();
  final TextEditingController _dobController = TextEditingController();
  final TextEditingController _bankAccController = TextEditingController();
  final TextEditingController _ifscController = TextEditingController();
  final TextEditingController _nomineeNameController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  String _maritalStatus = 'Single';
  String _occupation = 'Salaried';
  String _nomineeRelation = 'Spouse';
  String _riskProfile = 'GROWTH';
  String _bankLookupInfo = '';
  bool _isSendingOtp = false;

  final List<String> _stepTitles = [
    'Mobile Phone Verification (SMS OTP)',
    'Enter Mobile OTP Code',
    'Registered Email Verification',
    'Enter Email Confirmation Code',
    'PAN Card Validation',
    'Personal Details (DOB, Marital, Occupation)',
    'Bank Account & Live RBI IFSC Lookup',
    'SEBI Nominee Declaration',
    'Communication Address',
    'Investor Risk Profile & Activation',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Indian KYC Verification')),
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
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: '10-Digit Mobile Number',
                hintText: 'Enter your 10-digit mobile number',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _isSendingOtp ? null : _sendPhoneOtp,
              child: _isSendingOtp
                  ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('📲 Send Real SMS OTP'),
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
              decoration: const InputDecoration(
                labelText: '6-Digit SMS Code',
                hintText: 'Enter code received on mobile',
                border: OutlineInputBorder(),
              ),
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
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Registered Email Address',
                hintText: 'name@domain.com',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _isSendingOtp ? null : _sendEmailOtp,
              child: const Text('📧 Send Email Verification Code'),
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
              decoration: const InputDecoration(
                labelText: '6-Digit Email Code',
                hintText: 'Enter code from email inbox',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(onPressed: _verifyEmailOtp, child: const Text('Confirm Email')),
          ],
        );

      case 4:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _panController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: '10-Character PAN Number',
                hintText: 'e.g. ABCDE1234F',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(onPressed: _verifyPan, child: const Text('Validate PAN with Tax Registry')),
          ],
        );

      case 5:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _dobController,
              decoration: const InputDecoration(labelText: 'Date of Birth (YYYY-MM-DD)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: _maritalStatus,
              decoration: const InputDecoration(labelText: 'Marital Status', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'Single', child: Text('Single')),
                DropdownMenuItem(value: 'Married', child: Text('Married')),
                DropdownMenuItem(value: 'Other', child: Text('Other')),
              ],
              onChanged: (v) => setState(() => _maritalStatus = v ?? 'Single'),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: _occupation,
              decoration: const InputDecoration(labelText: 'Occupation', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'Salaried', child: Text('Salaried')),
                DropdownMenuItem(value: 'Self-Employed', child: Text('Self-Employed')),
                DropdownMenuItem(value: 'Business', child: Text('Business')),
                DropdownMenuItem(value: 'Professional', child: Text('Professional')),
                DropdownMenuItem(value: 'Student', child: Text('Student')),
                DropdownMenuItem(value: 'Retired', child: Text('Retired')),
              ],
              onChanged: (v) => setState(() => _occupation = v ?? 'Salaried'),
            ),
          ],
        );

      case 6:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _bankAccController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Bank Account Number', hintText: 'Enter 9-18 digit account number', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _ifscController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'IFSC Code', hintText: 'e.g. HDFC0001234', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            ElevatedButton(onPressed: _lookupIfsc, child: const Text('Lookup RBI IFSC')),
            if (_bankLookupInfo.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(_bankLookupInfo, style: const TextStyle(color: AppTheme.gainGreen, fontWeight: FontWeight.w700, fontSize: 12)),
            ],
          ],
        );

      case 7:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _nomineeNameController,
              decoration: const InputDecoration(labelText: 'Nominee Full Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: _nomineeRelation,
              decoration: const InputDecoration(labelText: 'Relationship', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'Spouse', child: Text('Spouse')),
                DropdownMenuItem(value: 'Father', child: Text('Father')),
                DropdownMenuItem(value: 'Mother', child: Text('Mother')),
                DropdownMenuItem(value: 'Child', child: Text('Child')),
                DropdownMenuItem(value: 'Sibling', child: Text('Sibling')),
              ],
              onChanged: (v) => setState(() => _nomineeRelation = v ?? 'Spouse'),
            ),
          ],
        );

      case 8:
        return TextField(
          controller: _addressController,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Full Residential Address with Pincode', border: OutlineInputBorder()),
        );

      case 9:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            DropdownButtonFormField<String>(
              value: _riskProfile,
              decoration: const InputDecoration(labelText: 'Risk Profile', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'CONSERVATIVE', child: Text('Conservative')),
                DropdownMenuItem(value: 'GROWTH', child: Text('Growth & Capital Appreciation')),
                DropdownMenuItem(value: 'AGGRESSIVE', child: Text('Aggressive (Equities & MIS)')),
              ],
              onChanged: (v) => setState(() => _riskProfile = v ?? 'GROWTH'),
            ),
            const SizedBox(height: 16),
            const Text('🎉 Verified KYC Ready for Activation', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 4),
            const Text('Your Indian trading account will be activated with ₹5,00,000 simulated capital.'),
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
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter your mobile number'), backgroundColor: AppTheme.lossRed));
      return;
    }
    setState(() => _isSendingOtp = true);
    try {
      final res = await ApiService.post('/kyc/send-phone-otp', {'phone': phone});
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
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter your email address'), backgroundColor: AppTheme.lossRed));
      return;
    }
    setState(() => _isSendingOtp = true);
    try {
      final res = await ApiService.post('/kyc/send-email-otp', {'email': email});
      setState(() {
        _isSendingOtp = false;
        _currentStep = 3;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Email code dispatched!'), backgroundColor: AppTheme.gainGreen),
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
        'dob': _dobController.text.trim(),
        'maritalStatus': _maritalStatus,
        'occupation': _occupation,
        'bankAccount': _bankAccController.text.trim(),
        'ifsc': _ifscController.text.trim(),
        'nominee': {'name': _nomineeNameController.text.trim(), 'relation': _nomineeRelation},
        'address': _addressController.text.trim(),
        'riskProfile': _riskProfile
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
