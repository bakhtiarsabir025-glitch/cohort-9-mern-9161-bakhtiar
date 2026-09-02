import client from './client';

export const login = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
};

export const signup = async (email, password) => {
  const response = await client.post('/auth/signup', { email, password });
  return response.data;
};
