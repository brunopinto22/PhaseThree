const apiUrl = process.env.REACT_APP_API_URL || '/api';

/**
 * Fetches the list of students supervised by a specific teacher
 * @param {number} teacherId - The ID of the teacher
 * @param {string} token - JWT authentication token
 * @param {Function} setStatus - Function to set status message
 * @param {Function} setErrorMessage - Function to set error message
 * @returns {Object|null} - Supervised students data or null on error
 */
export const getTeacherSupervisedStudents = async (
  teacherId,
  token,
  setStatus,
  setErrorMessage
) => {
  try {
    if (setStatus) setStatus("Carregando estudantes supervisionados...");
    if (setErrorMessage) setErrorMessage("");

    const response = await fetch(
      `${apiUrl}/teacher/${teacherId}/supervised-students/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.error || "Erro ao carregar dados";
      if (setErrorMessage) setErrorMessage(errorMsg);
      if (setStatus) setStatus("");
      return null;
    }

    if (setStatus) setStatus("");
    return data;
  } catch (error) {
    const errorMsg = "Erro ao conectar com o servidor";
    if (setErrorMessage) setErrorMessage(errorMsg);
    if (setStatus) setStatus("");
    console.error("Error fetching teacher supervised students:", error);
    return null;
  }
};

/**
 * Fetches the list of students supervised by a specific representative
 * @param {number} representativeId - The ID of the representative
 * @param {string} token - JWT authentication token
 * @param {Function} setStatus - Function to set status message
 * @param {Function} setErrorMessage - Function to set error message
 * @returns {Object|null} - Supervised students data or null on error
 */
export const getRepresentativeSupervisedStudents = async (
  representativeId,
  token,
  setStatus,
  setErrorMessage
) => {
  try {
    if (setStatus) setStatus("Carregando estudantes supervisionados...");
    if (setErrorMessage) setErrorMessage("");

    const response = await fetch(
      `${apiUrl}/representative/${representativeId}/supervised-students/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.error || "Erro ao carregar dados";
      if (setErrorMessage) setErrorMessage(errorMsg);
      if (setStatus) setStatus("");
      return null;
    }

    if (setStatus) setStatus("");
    return data;
  } catch (error) {
    const errorMsg = "Erro ao conectar com o servidor";
    if (setErrorMessage) setErrorMessage(errorMsg);
    if (setStatus) setStatus("");
    console.error("Error fetching representative supervised students:", error);
    return null;
  }
};
