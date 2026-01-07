import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Update this to your backend URL
const getBaseURL = () => {
  if (__DEV__) {
    // Try multiple ways to get the debugger host
    const manifest = Constants.manifest || Constants.manifest2?.extra?.expoClient;
    const expoConfig = Constants.expoConfig;
    
    const debuggerHost = 
      manifest?.debuggerHost || 
      manifest?.hostUri ||
      expoConfig?.hostUri;
    
    if (debuggerHost && Platform.OS !== 'web') {
      const host = debuggerHost.split(':')[0];
      return `http://${host}:8000`;
    }
    
    // Fallback for Android when debugger host not available
    if (Platform.OS === 'android') {
      return 'http://10.150.165.83:8000'; // Update to your computer's IP
    }
    
    return 'http://localhost:8000';
  }
  return 'https://your-production-api.com';
};

const API_BASE_URL = getBaseURL();

// In-memory token storage
let accessToken: string | null = null;

// Token management functions
export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('refreshToken');
    }
    return await SecureStore.getItemAsync('refreshToken');
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('refreshToken', token);
    } else {
      await SecureStore.setItemAsync('refreshToken', token);
    }
  } catch (error) {
    console.error('Error setting refresh token:', error);
  }
};

export const clearTokens = async (): Promise<void> => {
  accessToken = null;
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('accessToken');
    } else {
      await SecureStore.deleteItemAsync('refreshToken');
    }
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased timeout for Android
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      // No refresh token, clear everything and reject
      await clearTokens();
      processQueue(new Error('No refresh token available'));
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      // Attempt to refresh the token
      const response = await axios.post(`${API_BASE_URL}/api/refresh/`, {
        refresh: refreshToken,
      });

      const { access, refresh } = response.data;

      // Update tokens
      setAccessToken(access);
      if (refresh) {
        await setRefreshToken(refresh);
      }

      // Update auth header and retry original request
      originalRequest.headers.Authorization = `Bearer ${access}`;
      
      processQueue();
      isRefreshing = false;

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed, clear tokens and logout
      await clearTokens();
      processQueue(refreshError);
      isRefreshing = false;
      
      // You might want to dispatch a logout action or navigate to login here
      // For example: store.dispatch(logout());
      
      return Promise.reject(refreshError);
    }
  }
);

export default api;
