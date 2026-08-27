// API Client for NexTrade Pro Backend

class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-allow-demo': 'true',
      ...options.headers
    };

    if (Store.token) {
      headers['Authorization'] = `Bearer ${Store.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.error || `Request failed (${response.status})`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.warn(`API Error [${path}]:`, err.message);
      throw err;
    }
  }

  get(path, options) {
    return this.request(path, { method: 'GET', ...options });
  }

  post(path, body, options) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options
    });
  }

  patch(path, body, options) {
    return this.request(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options
    });
  }

  delete(path, options) {
    return this.request(path, { method: 'DELETE', ...options });
  }
}

const api = new ApiClient();
