import client from './client';

export const getNotes = async () => {
  const response = await client.get('/notes');
  return response.data?.data || [];
};

export const createNote = async (noteData) => {
  const response = await client.post('/notes', noteData);
  return response.data;
};

export const updateNote = async (id, noteData) => {
  const response = await client.put(`/notes/${id}`, noteData);
  return response.data;
};

export const deleteNote = async (id) => {
  const response = await client.delete(`/notes/${id}`);
  return response.data;
};

export const restoreNote = async (id) => {
  const response = await client.post(`/notes/${id}/restore`);
  return response.data;
};

export const pinNote = async (id) => {
  const response = await client.patch(`/notes/${id}/pin`);
  return response.data;
};

export const getCategories = async () => {
  const response = await client.get('/notes/categories');
  return response.data;
};

export const getStats = async () => {
  const response = await client.get('/notes/stats');
  return response.data;
};
