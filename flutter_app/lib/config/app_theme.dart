import 'package:flutter/material.dart';

class AppTheme {
  // Brand Colors
  static const Color brandPrimary = Color(0xFF00D084); // Emerald Green
  static const Color brandSecondary = Color(0xFF3B82F6); // Electric Blue
  static const Color brandAccent = Color(0xFF8B5CF6); // Violet

  // Financial Semantics
  static const Color gainGreen = Color(0xFF00D084);
  static const Color lossRed = Color(0xFFFF3B57);
  static const Color warningAmber = Color(0xFFF59E0B);
  static const Color simulatedBadge = Color(0xFF06B6D4);

  // Dark Theme Palette
  static const Color darkBg = Color(0xFF090D14);
  static const Color darkSurface = Color(0xFF111722);
  static const Color darkSurfaceSubtle = Color(0xFF172030);
  static const Color darkBorder = Color(0xFF1E293B);
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkTextTertiary = Color(0xFF64748B);

  // Light Theme Palette
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceSubtle = Color(0xFFF1F5F9);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF475569);
  static const Color lightTextTertiary = Color(0xFF94A3B8);

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: darkBg,
    primaryColor: brandPrimary,
    cardColor: darkSurface,
    dividerColor: darkBorder,
    colorScheme: const ColorScheme.dark(
      primary: brandPrimary,
      secondary: brandSecondary,
      surface: darkSurface,
      background: darkBg,
      error: lossRed,
      onPrimary: Colors.black,
      onSurface: darkTextPrimary,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: darkSurface,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: darkTextPrimary,
        fontSize: 18,
        fontWeight: FontWeight.w800,
      ),
      iconTheme: IconThemeData(color: darkTextPrimary),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: darkSurface,
      selectedItemColor: brandPrimary,
      unselectedItemColor: darkTextTertiary,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    cardTheme: CardTheme(
      color: darkSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: darkBorder, width: 1),
      ),
    ),
  );

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: lightBg,
    primaryColor: brandPrimary,
    cardColor: lightSurface,
    dividerColor: lightBorder,
    colorScheme: const ColorScheme.light(
      primary: brandPrimary,
      secondary: brandSecondary,
      surface: lightSurface,
      background: lightBg,
      error: lossRed,
      onPrimary: Colors.white,
      onSurface: lightTextPrimary,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: lightSurface,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: lightTextPrimary,
        fontSize: 18,
        fontWeight: FontWeight.w800,
      ),
      iconTheme: IconThemeData(color: lightTextPrimary),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: lightSurface,
      selectedItemColor: brandPrimary,
      unselectedItemColor: lightTextTertiary,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    cardTheme: CardTheme(
      color: lightSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: lightBorder, width: 1),
      ),
    ),
  );
}
