import client from './client';

export const login = async (email, password) => {
  try {
    const response = await client.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Network error, please try again';
    throw new Error(message);
  }
};

export const signup = async (email, password) => {
  try {
    const response = await client.post('/auth/signup', { email, password });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Network error, please try again';
    throw new Error(message);
  }
};