import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { APIResponse } from '@/types';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<APIResponse<any>>) => {
        return response;
      },
      (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/auth/login';
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else if (error.message) {
          toast.error(error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<APIResponse<T>> {
    const response = await this.client.get<APIResponse<T>>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<APIResponse<T>> {
    const response = await this.client.post<APIResponse<T>>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<APIResponse<T>> {
    const response = await this.client.put<APIResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<APIResponse<T>> {
    const response = await this.client.delete<APIResponse<T>>(url);
    return response.data;
  }

  async upload<T>(url: string, formData: FormData): Promise<APIResponse<T>> {
    const response = await this.client.post<APIResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const apiClient = new APIClient();