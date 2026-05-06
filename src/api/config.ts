import AsyncStorage from '@react-native-async-storage/async-storage';

const IP_ADDRESS_KEY = '@api_ip_address';
const DEFAULT_IP = '10.0.2.2'; // Default for Android emulator
const DEFAULT_PORT = '3000';

// Memory fallback if AsyncStorage native module is not linked yet
let memoryIp: string | null = null;

export const getApiIp = async (): Promise<string> => {
  try {
    const savedIp = await AsyncStorage.getItem(IP_ADDRESS_KEY);
    return savedIp || memoryIp || DEFAULT_IP;
  } catch (error) {
    console.warn('AsyncStorage not available, using memory fallback:', error);
    return memoryIp || DEFAULT_IP;
  }
};

export const saveApiIp = async (ip: string): Promise<void> => {
  try {
    memoryIp = ip;
    await AsyncStorage.setItem(IP_ADDRESS_KEY, ip);
  } catch (error) {
    console.error('Error saving IP address to AsyncStorage:', error);
  }
};

export const getBaseUrl = async (): Promise<string> => {
  const ip = await getApiIp();
  return `http://${ip}:${DEFAULT_PORT}/api`;
};
