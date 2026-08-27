class MockKYCProvider {
  // Simulate PAN card verification against NSDL/Income Tax department
  verifyPAN(pan = '', fullName = '', dob = '') {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const isValidFormat = panRegex.test(pan.toUpperCase());
    if (!isValidFormat) {
      return {
        success: false,
        status: 'INVALID_PAN_FORMAT',
        message: 'Invalid PAN format. Must be 10 characters (5 letters, 4 digits, 1 letter).'
      };
    }

    return {
      success: true,
      status: 'VERIFIED',
      pan: pan.toUpperCase(),
      registeredName: fullName.toUpperCase(),
      category: 'INDIVIDUAL',
      message: 'PAN verified successfully against NSDL database.'
    };
  }

  // Simulate Bank Account verification via Penny Drop API
  verifyBankAccount(accountNumber = '', ifsc = '') {
    if (!accountNumber || accountNumber.length < 8) {
      return { success: false, message: 'Account number must be at least 8 digits.' };
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc.toUpperCase())) {
      return { success: false, message: 'Invalid IFSC code format.' };
    }

    return {
      success: true,
      status: 'VERIFIED',
      beneficiaryName: 'BHARATH DEVAN',
      bankName: ifsc.toUpperCase().startsWith('HDFC') ? 'HDFC Bank' : ifsc.toUpperCase().startsWith('SBIN') ? 'State Bank of India' : 'ICICI Bank',
      accountNumber: 'X'.repeat(accountNumber.length - 4) + accountNumber.slice(-4),
      ifsc: ifsc.toUpperCase(),
      pennyDropStatus: 'SUCCESS'
    };
  }
}

module.exports = new MockKYCProvider();
