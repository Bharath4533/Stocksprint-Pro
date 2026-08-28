import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const KycScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);

  const [phone, setPhone] = useState(user?.phone?.replace(/[^0-9]/g, '').slice(-10) || '');
  const [email, setEmail] = useState(user?.email || '');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('1996-05-14');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [occupation, setOccupation] = useState('Salaried');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankInfo, setBankInfo] = useState(null);
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('Spouse');
  const [address, setAddress] = useState('');
  const [riskProfile, setRiskProfile] = useState('GROWTH');
  const [isLoading, setIsLoading] = useState(false);

  const handleLookupIfsc = async () => {
    if (!ifsc || ifsc.length < 10) {
      Alert.alert('Invalid IFSC', 'Please enter a valid 11-digit IFSC code.');
      return;
    }
    try {
      const res = await api.get(`/kyc/lookup-ifsc/${ifsc.toUpperCase()}`);
      setBankInfo(res);
      Alert.alert('IFSC Verified!', `🏦 ${res.bankName} (${res.branch}, ${res.city})`);
    } catch (e) {
      Alert.alert('IFSC Error', e.message);
    }
  };

  const handleVerifyPan = async () => {
    if (!pan || pan.length !== 10) {
      Alert.alert('Invalid PAN', 'PAN must be exactly 10 characters (e.g. ABCDE1234F).');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/kyc/verify-pan', { pan: pan.toUpperCase(), fullName: user?.name || 'Taxpayer' });
      Alert.alert('PAN Verified!', `Verified: ${res.entityType}`);
      setStep(3);
    } catch (e) {
      Alert.alert('PAN Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteKYC = async () => {
    if (!address || address.length < 8) {
      Alert.alert('Incomplete Address', 'Please enter your full communication address.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/kyc/submit', {
        phone,
        email,
        pan,
        dob,
        maritalStatus,
        occupation,
        bankAccount: accountNumber,
        ifsc,
        nominee: { name: nomineeName, relation: nomineeRelation },
        address,
        riskProfile,
      });
      await refreshUser();
      Alert.alert('KYC Verified! 🎉', 'Your Indian trading account is activated with ₹5,00,000 capital!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('KYC Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Progress Tracker */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Step {step} of 6</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
          </View>
        </View>

        {/* Step 1: Contact */}
        {step === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Step 1: Contact Information</Text>
            <Text style={styles.stepSub}>Enter your mobile number and email for trade alerts.</Text>

            <Text style={styles.label}>10-Digit Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 9876543210"
              placeholderTextColor={Colors.textTertiary}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="name@domain.com"
              placeholderTextColor={Colors.textTertiary}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.btnText}>Continue to PAN Validation ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: PAN */}
        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Step 2: Income Tax PAN Card</Text>
            <Text style={styles.stepSub}>Mandatory for Indian financial securities.</Text>

            <Text style={styles.label}>10-Character PAN (e.g. ABCDE1234F)</Text>
            <TextInput
              style={[styles.input, { textTransform: 'uppercase' }]}
              value={pan}
              onChangeText={setPan}
              maxLength={10}
              placeholder="Enter 10-char PAN"
              placeholderTextColor={Colors.textTertiary}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyPan} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Validate PAN ➔</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Demographics */}
        {step === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Step 3: Personal Information</Text>
            <Text style={styles.stepSub}>Regulatory demographic requirements.</Text>

            <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dob}
              onChangeText={setDob}
              placeholder="1996-05-14"
              placeholderTextColor={Colors.textTertiary}
            />

            <Text style={styles.label}>Marital Status</Text>
            <View style={styles.pillRow}>
              {['Single', 'Married', 'Other'].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pill, maritalStatus === m && styles.pillActive]}
                  onPress={() => setMaritalStatus(m)}
                >
                  <Text style={[styles.pillText, maritalStatus === m && styles.pillTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Occupation</Text>
            <View style={styles.pillRow}>
              {['Salaried', 'Self-Employed', 'Business', 'Student'].map(o => (
                <TouchableOpacity
                  key={o}
                  style={[styles.pill, occupation === o && styles.pillActive]}
                  onPress={() => setOccupation(o)}
                >
                  <Text style={[styles.pillText, occupation === o && styles.pillTextActive]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(4)}>
              <Text style={styles.btnText}>Continue to Bank Details ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Bank */}
        {step === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Step 4: Bank & Live RBI IFSC</Text>
            <Text style={styles.stepSub}>Links your bank account for funds ledger.</Text>

            <Text style={styles.label}>Bank Account Number</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              placeholder="e.g. 50100492837192"
              placeholderTextColor={Colors.textTertiary}
            />

            <Text style={styles.label}>11-Character IFSC Code</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1, textTransform: 'uppercase' }]}
                value={ifsc}
                onChangeText={setIfsc}
                maxLength={11}
                placeholder="e.g. HDFC0001234"
                placeholderTextColor={Colors.textTertiary}
              />
              <TouchableOpacity style={styles.lookupBtn} onPress={handleLookupIfsc}>
                <Text style={styles.lookupText}>Lookup</Text>
              </TouchableOpacity>
            </View>

            {bankInfo && (
              <View style={styles.bankCard}>
                <Text style={styles.bankName}>🏦 {bankInfo.bankName}</Text>
                <Text style={styles.bankBranch}>Branch: {bankInfo.branch}, {bankInfo.city}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(5)}>
              <Text style={styles.btnText}>Continue to Nominee ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 5: Nominee */}
        {step === 5 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Step 5: SEBI Nominee Declaration</Text>
            <Text style={styles.stepSub}>Appoint a nominee for your trading securities.</Text>

            <Text style={styles.label}>Nominee Full Name</Text>
            <TextInput
              style={styles.input}
              value={nomineeName}
              onChangeText={setNomineeName}
              placeholder="e.g. Ananya Sharma"
              placeholderTextColor={Colors.textTertiary}
            />

            <Text style={styles.label}>Relationship with Nominee</Text>
            <View style={styles.pillRow}>
              {['Spouse', 'Father', 'Mother', 'Child', 'Sibling'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, nomineeRelation === r && styles.pillActive]}
                  onPress={() => setNomineeRelation(r)}
                >
                  <Text style={[styles.pillText, nomineeRelation === r && styles.pillTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(6)}>
              <Text style={styles.btnText}>Continue to Address & Activation ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 6: Address & Submit */}
        {step === 6 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Step 6: Residential Address & Risk Profile</Text>
            <Text style={styles.stepSub}>Final step to activate your trading capital.</Text>

            <Text style={styles.label}>Full Residential Address with Pincode</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              value={address}
              onChangeText={setAddress}
              multiline
              placeholder="Enter full address with 6-digit pincode..."
              placeholderTextColor={Colors.textTertiary}
            />

            <Text style={styles.label}>Investor Risk Profile</Text>
            <View style={styles.pillRow}>
              {['CONSERVATIVE', 'GROWTH', 'AGGRESSIVE'].map(rp => (
                <TouchableOpacity
                  key={rp}
                  style={[styles.pill, riskProfile === rp && styles.pillActive]}
                  onPress={() => setRiskProfile(rp)}
                >
                  <Text style={[styles.pillText, riskProfile === rp && styles.pillTextActive]}>{rp}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: Colors.gainGreen, marginTop: 24 }]} onPress={handleCompleteKYC} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>🚀 Submit KYC & Activate ₹5,00,000</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  progressCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.brandPrimary,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brandPrimary,
  },
  stepCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  stepSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.bgCard,
  },
  pillActive: {
    backgroundColor: Colors.brandPrimary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#000',
  },
  lookupBtn: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookupText: {
    color: Colors.brandPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  bankCard: {
    backgroundColor: Colors.bgCard,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  bankName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gainGreen,
  },
  bankBranch: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: Colors.brandPrimary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
});

export default KycScreen;
