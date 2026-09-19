const API_BASE = '/api/employee';

/**
 * Fetch wrapper for making API requests to the backend.
 * Automatically handles JWT tokens and JSON parsing.
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Only set Content-Type to JSON if we are not sending FormData (for multipart)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Invalid response from server');
  }

  if (!response.ok) {
    // If it's validation errors array
    if (data.errors && Array.isArray(data.errors)) {
      throw new Error(data.errors[0].msg || 'Validation error');
    }
    throw new Error(data.message || 'API error');
  }

  return data;
}
