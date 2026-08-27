class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String kycStatus;
  final bool isDemo;
  final String? phone;
  final String? pan;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.kycStatus,
    this.isDemo = false,
    this.phone,
    this.pan,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'USER',
      kycStatus: json['kycStatus'] ?? 'PENDING',
      isDemo: json['isDemo'] ?? false,
      phone: json['phone'],
      pan: json['pan'],
    );
  }
}
