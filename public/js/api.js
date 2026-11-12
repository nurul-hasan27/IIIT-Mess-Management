/**
 * IIIT Bhubaneswar Mess Management System
 * API Service Client
 */

const API = {
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    // If body is an object and not FormData/string, stringify
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(endpoint, config);

      if (response.status === 401 && !endpoint.includes('/api/auth/login') && !endpoint.includes('/api/auth/me')) {
        window.location.href = 'login.html';
        return;
      }

      // If returning CSV or binary
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        return response.blob();
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server request failed');
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const url = new URL(endpoint, window.location.origin);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    return this.request(url.toString(), { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

window.API = API;
