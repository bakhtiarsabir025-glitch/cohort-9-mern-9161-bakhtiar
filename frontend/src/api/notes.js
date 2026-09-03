import client from './client';

export const getNotes = async (params = {}) => {
  try {
    const response = await client.get('/notes', { params: { status: 'all', ...params } });
    return response.data?.data || [];
  } catch (error) {
    const message = error.response?.data?.message || 'Network error, please try again';
    throw new Error(message);
  }
};

export const createNote = async (noteData) => {
  try {
    const response = await client.post('/notes', noteData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Network error, please try again';
    throw new Error(message);
  }
};

export const updateNote = async (id, noteData) => {
  try {
    const response = await client.put(`/notes/${id}`, noteData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Network error, please try again';
    throw new Error(message);
  }
};

export const deleteNote = async (id) => {
  try {
    const response = await client.delete(`/notes/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Network error, please try again';
    throw new Error(message);
  }
};

export const restoreNote = async (id) => {
  try {
    const response = await client.post(`/notes/${id}/restore`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Network error, please try again';
    throw new Error(message);
  }
};

export const pinNote = async (id) => {
  try {
    const response = await client.patch(`/notes/${id}/pin`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Network error, please try again';
    throw new Error(message);
  }
};

export const getCategories = async () => {
  try {
    const response = await client.get('/notes/categories');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Network error, please try again';
    throw new Error(message);
  }
};

export const getStats = async () => {
  try {
    const response = await client.get('/notes/stats');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Network error, please try again';
    throw new Error(message);
  }
};
