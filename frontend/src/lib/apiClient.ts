import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

const axiosClient = (token: string | null = null): AxiosInstance => {
  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    : {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

  const client = axios.create({
    baseURL: 'http://localhost:3333/',
    headers,
    timeout: 60000,
    withCredentials: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('ACCESS_TOKEN');
    config.headers = config.headers || {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      try {
        const { response } = error;
        if (response?.status === 401) {
          localStorage.removeItem('ACCESS_TOKEN');
        }
      } catch (e) {
        console.error(e);
      }
      throw error;
    }
  );

  return client;
};

export const apiRequest = async <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
): Promise<T> => {
  const response: AxiosResponse<T> = await axiosClient().request({
    method,
    url,
    data,
  });

  return response.data;
};

export default axiosClient;
