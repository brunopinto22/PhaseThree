const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Upload curriculum file for a student
 * @param {number} studentId - Student ID
 * @param {File} file - Curriculum file (PDF)
 * @param {string} token - Auth token
 * @returns {Promise} Response with curriculum_url
 */
export const uploadCurriculum = async (studentId, file, token) => {
  try {
    const formData = new FormData();
    formData.append('curriculum', file);

    const response = await fetch(
      `${API_URL}/student/${studentId}/curriculum/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      }
    );

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = isJson ? payload?.message : payload;
      throw new Error(message || 'Erro ao fazer upload do currículo');
    }

    return payload;
  } catch (error) {
    throw error;
  }
};

/**
 * Get curriculum for a student
 * @param {number} studentId - Student ID
 * @param {string} token - Auth token
 * @returns {Promise} Response with curriculum_url and curriculum_name
 */
export const getCurriculum = async (studentId, token) => {
  try {
    const response = await fetch(`${API_URL}/student/${studentId}/curriculum`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Erro ao obter currículo');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const deleteCurriculum = async (studentId, token) => {
  try {
    const response = await fetch(`${API_URL}/student/${studentId}/curriculum/delete`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = isJson ? payload?.message : payload;
      throw new Error(message || 'Erro ao eliminar currículo');
    }

    return payload;
  } catch (error) {
    throw error;
  }
};
