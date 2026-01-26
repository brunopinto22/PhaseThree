const apiUrl = process.env.REACT_APP_API_URL || '/api';

/**
 * Submete uma nova candidatura com lista de propostas
 * @param {string} token - Token de autenticação
 * @param {Array<number>} proposalIds - Lista de IDs das propostas selecionadas
 * @param {Function} setStatus - Callback para status HTTP
 * @param {Function} setErrorMessage - Callback para mensagens de erro
 * @returns {Object|null} - Dados da candidatura criada ou null em caso de erro
 */
export async function submitCandidature(token, proposalIds, setStatus, setErrorMessage) {
  try {
    const res = await fetch(`${apiUrl}/candidature/submit/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({ proposal_ids: proposalIds }),
    });

    const data = await res.json();
    setStatus(res.status);

    if (res.status !== 201) {
      setErrorMessage(data.message || "Erro ao submeter candidatura");
      return null;
    }

    setErrorMessage("");
    return data;

  } catch (error) {
    setErrorMessage("Erro de rede ou servidor");
    return null;
  }
}

/**
 * Atualiza uma candidatura existente com nova lista de propostas
 * @param {string} token - Token de autenticação
 * @param {number} candidatureId - ID da candidatura a atualizar
 * @param {Array<number>} proposalIds - Nova lista de IDs das propostas
 * @param {Function} setStatus - Callback para status HTTP
 * @param {Function} setErrorMessage - Callback para mensagens de erro
 * @returns {Object|null} - Resposta de sucesso ou null em caso de erro
 */
export async function updateCandidature(token, candidatureId, proposalIds, setStatus, setErrorMessage) {
  try {
    const res = await fetch(`${apiUrl}/candidature/update/${candidatureId}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({ proposal_ids: proposalIds }),
    });

    const data = await res.json();
    setStatus(res.status);

    if (res.status !== 200) {
      setErrorMessage(data.message || "Erro ao atualizar candidatura");
      return null;
    }

    setErrorMessage("");
    return data;

  } catch (error) {
    setErrorMessage("Erro de rede ou servidor");
    return null;
  }
}

/**
 * Obtém a candidatura do aluno autenticado
 * @param {string} token - Token de autenticação
 * @param {Function} setStatus - Callback para status HTTP
 * @param {Function} setErrorMessage - Callback para mensagens de erro
 * @returns {Object|null} - Dados da candidatura ou info do calendário se não tiver candidatura
 */
export async function getMyCandidature(token, setStatus, setErrorMessage) {
  try {
    const res = await fetch(`${apiUrl}/candidature/me/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
    });

    const data = await res.json();
    setStatus(res.status);

    if (res.status !== 200) {
      setErrorMessage(data.message || "Erro ao obter candidatura");
      return null;
    }

    setErrorMessage("");
    return data;

  } catch (error) {
    setErrorMessage("Erro de rede ou servidor");
    return null;
  }
}

/**
 * Obtém o histórico de mudanças de estado de uma candidatura
 * @param {string} token - Token de autenticação
 * @param {number} candidatureId - ID da candidatura
 * @param {Function} setStatus - Callback para status HTTP
 * @param {Function} setErrorMessage - Callback para mensagens de erro
 * @returns {Object|null} - Histórico da candidatura ou null em caso de erro
 */
export async function getCandidatureHistory(token, candidatureId, setStatus, setErrorMessage) {
  try {
    const res = await fetch(`${apiUrl}/candidature/${candidatureId}/history/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
    });

    const data = await res.json();
    setStatus(res.status);

    if (res.status !== 200) {
      setErrorMessage(data.message || "Erro ao obter histórico");
      return null;
    }

    setErrorMessage("");
    return data;

  } catch (error) {
    setErrorMessage("Erro de rede ou servidor");
    return null;
  }
}
