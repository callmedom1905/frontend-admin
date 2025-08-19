// lib/apiClient.ts
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_ONLY || 'https://moobeefsteak.online';
const API_PREFIX = '/api/admin';

// Default API response interface
interface DefaultApiResponse<T = any> {
  data: T;
  message?: string;
  status?: string;
}

class ApiClient {
  private csrfInitialized = false;

  // Get base URL
  getBaseUrl(): string {
    return API_BASE_URL;
  }

  // Initialize CSRF token
  async initializeCSRF(): Promise<void> {
    if (this.csrfInitialized) return;
    
    try {
      // Get the Sanctum CSRF cookie (this is not in /api prefix)
      await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
        credentials: 'include'
      });
      
      this.csrfInitialized = true;
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
      // Don't throw error, just log it
    }
  }

  // Get auth headers
  private getAuthHeaders(data?: any): Record<string, string> {
    const token = Cookies.get('token');
    const xsrfToken = Cookies.get('XSRF-TOKEN');
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Only set Content-Type for JSON data, not for FormData
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add CSRF token if available
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic request method
  async request<T = DefaultApiResponse>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // List of public endpoints that should NOT have /admin prefix
    const PUBLIC_ENDPOINTS = [
      '/login',
      '/login/phone',
      '/register',
      '/csrf-token',
      '/sanctum/csrf-cookie',
      '/file-manager', // for file manager public routes if any
      '/search',
    ];
    // Check if endpoint is public
    const isPublic = PUBLIC_ENDPOINTS.some(pub => endpoint === pub || endpoint.startsWith(pub + '/') || endpoint.startsWith(pub + '?'));
    const prefix = isPublic ? '/api' : API_PREFIX;
    const fullEndpoint = endpoint.startsWith('/api') ? endpoint : `${prefix}${endpoint}`;
    const url = `${API_BASE_URL}${fullEndpoint}`;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...this.getAuthHeaders(options.body),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Clear invalid auth data
        Cookies.remove('token');
        Cookies.remove('user');
        window.location.href = '/signin';
        throw new Error('Unauthorized');
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Check if response is JSON or text
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // For text responses like "OK" from Laravel File Manager
        const textResponse = await response.text();
        return textResponse as T;
      }
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // GET request
  async get<T = DefaultApiResponse>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T = DefaultApiResponse>(endpoint: string, data?: any): Promise<T> {
    let body: any = undefined;
    
    // Handle FormData vs JSON data
    if (data instanceof FormData) {
      body = data; // Don't stringify FormData
    } else if (data) {
      body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: body,
    });
  }

  // PUT request
  async put<T = DefaultApiResponse>(endpoint: string, data?: any): Promise<T> {
    let body: any = undefined;
    
    // Handle FormData vs JSON data
    if (data instanceof FormData) {
      body = data; // Don't stringify FormData
    } else if (data) {
      body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body,
    });
  }

  // DELETE request
  async delete<T = DefaultApiResponse>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch<T = DefaultApiResponse>(endpoint: string, data?: any): Promise<T> {
    let body: any = undefined;
    
    // Handle FormData vs JSON data
    if (data instanceof FormData) {
      body = data; // Don't stringify FormData
    } else if (data) {
      body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body,
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Auth-specific methods
export const authAPI = {
  // Initialize CSRF and check auth status
  async initialize(): Promise<void> {
    await apiClient.initializeCSRF();
  },

  // Login with email
  async login(email: string, password: string) {
    return apiClient.post('/login', { email, password });
  },

  // Login with phone
  async loginByPhone(phone: string, password: string) {
    return apiClient.post('/login/phone', { phone, password });
  },

  // Logout
  async logout() {
    return apiClient.post('/logout');
  },

  // Get current user
  async getUser() {
    return apiClient.get('/user');
  },

  // Register new user
  async register(userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    id_role?: number;
  }) {
    return apiClient.post('/register', userData);
  },
};

// Export for use in components
export default apiClient;