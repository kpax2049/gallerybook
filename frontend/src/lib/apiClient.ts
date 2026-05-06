/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from '@/hooks/use-toast';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL ?? '';

const safeStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

const getAccessToken = () => {
  const storage = safeStorage();
  if (!storage || typeof storage.getItem !== 'function') return null;
  try {
    return storage.getItem('ACCESS_TOKEN');
  } catch {
    return null;
  }
};

const setAccessToken = (token: string) => {
  const storage = safeStorage();
  if (storage && typeof storage.setItem === 'function') {
    try {
      storage.setItem('ACCESS_TOKEN', token);
    } catch {
      // no-op
    }
  }
};

const clearAccessToken = () => {
  const storage = safeStorage();
  if (storage && typeof storage.removeItem === 'function') {
    try {
      storage.removeItem('ACCESS_TOKEN');
    } catch {
      // no-op
    }
  }
};

export const errorHandler = (error: AxiosError | undefined) => {
  if (error?.status === 401) {
    clearAccessToken();
    //TODO: redirect back to root/login page
    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: `You are unauthorized to access this Page. Please login again.`,
    });
  } else {
    const responseData = error?.response?.data;
    const message = (responseData as any).message || error?.message;
    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: `There was a problem with your request: 
      ${message}`,
    });
  }
};

const client = axios.create({
  baseURL: VITE_API_URL,
  timeout: 60000,
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string }>(
        '/auth/refresh',
        undefined,
        {
          baseURL: VITE_API_URL,
          timeout: 60000,
          withCredentials: true,
        }
      )
      .then((response) => {
        const token = response.data.accessToken;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

client.interceptors.request.use((config: any) => {
  const token = getAccessToken();
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (typeof config.data === 'string') {
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (config.data !== undefined) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status ?? error.status;
    const requestUrl = originalRequest?.url ?? '';

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes('/auth/refresh') &&
      !requestUrl.includes('/auth/signin') &&
      !requestUrl.includes('/auth/signup')
    ) {
      originalRequest._retry = true;
      try {
        const token = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return client.request(originalRequest);
      } catch {
        clearAccessToken();
      }
    }

    try {
      errorHandler(error);
    } catch (e) {
      console.error(e);
    }
    throw error;
  }
);

export const apiRequest = async <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  data?: any,
  params?: any,
  signal?: AbortSignal
): Promise<T> => {
  const config: AxiosRequestConfig = {
    method,
    url,
    params,
    signal,
  };

  if (data !== undefined) config.data = data;
  const response: AxiosResponse<T> = await client.request(config);
  return response.data;
};

// Join arrays with commas and stringify booleans to match DTO transforms
export function serializeParams(params: Record<string, unknown>) {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      out[k] = v.join(',');
    } else {
      out[k] = v as any;
    }
  }
  return out;
}

export default client;
