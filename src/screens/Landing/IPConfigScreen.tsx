import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../../constants/theme";
import { getApiIp, saveApiIp } from "../../api/config";

const IPConfigScreen = ({ navigation }: any) => {
  const [ip, setIp] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentIp();
  }, []);

  const loadCurrentIp = async () => {
    const savedIp = await getApiIp();
    setIp(savedIp);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!ip.trim()) {
      Alert.alert("خطأ", "يرجى إدخال عنوان IP صحيح");
      return;
    }

    // Simple IP validation (basic)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip) && ip !== "localhost") {
      Alert.alert("خطأ", "يرجى إدخال عنوان IP صالح (مثال: 192.168.1.10)");
      return;
    }

    await saveApiIp(ip);
    navigation.replace("MainApp");
  };

  const handleSkip = () => {
    navigation.replace("MainApp");
  };

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>إعدادات الاتصال</Text>
          <Text style={styles.subtitle}>يرجى إدخال عنوان IP الخاص بالخادم</Text>

          <TextInput
            style={styles.input}
            placeholder="مثال: 192.168.1.10"
            value={ip}
            onChangeText={setIp}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.buttonText}>حفظ ومتابعة</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>تخطي الآن</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>يمكنك تغيير هذا الإعداد لاحقاً من قائمة "المزيد"</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 25,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  footerText: {
    marginTop: 30,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

export default IPConfigScreen;
