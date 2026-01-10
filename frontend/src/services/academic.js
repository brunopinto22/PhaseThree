const apiUrl = process.env.REACT_APP_API_URL || '/api';

export const getAcademicDashboard = async (token, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/academic/dashboard`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setStatus(response.status);

        if (!response.ok) {
            const error = await response.json();
            setError(error.message || 'Erro ao obter dashboard');
            return null;
        }

        return await response.json();
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const getAcademicPlacements = async (token, filters, setStatus, setError) => {
    try {
        const params = new URLSearchParams();
        if (filters?.state) params.append('state', filters.state);
        if (filters?.calendar) params.append('calendar', filters.calendar);
        if (filters?.course) params.append('course', filters.course);
        if (filters?.company) params.append('company', filters.company);

        const url = `${apiUrl}/academic/placements${params.toString() ? '?' + params.toString() : ''}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setStatus(response.status);

        if (!response.ok) {
            const error = await response.json();
            setError(error.message || 'Erro ao obter colocações');
            return null;
        }

        return await response.json();
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const advanceCandidature = async (token, candidatureId, newState, notes, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/academic/candidature/${candidatureId}/advance`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ state: newState, notes })
        });

        setStatus(response.status);

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Erro ao avançar candidatura');
            return null;
        }

        return data;
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const getPendingActions = async (token, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/academic/pending-actions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setStatus(response.status);

        if (!response.ok) {
            const error = await response.json();
            setError(error.message || 'Erro ao obter ações pendentes');
            return null;
        }

        return await response.json();
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const exportPlacements = async (token, filters) => {
    const params = new URLSearchParams();
    if (filters?.calendar) params.append('calendar', filters.calendar);
    if (filters?.state) params.append('state', filters.state);

    const url = `${apiUrl}/academic/placements/export${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao exportar dados');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'colocacoes.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
};

// Protocol-related services
export const generateProtocol = async (token, candidatureId, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/protocol/${candidatureId}/generate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setStatus(response.status);

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Erro ao gerar protocolo');
            return null;
        }

        return data;
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const signProtocol = async (token, protocolId, signatureType, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/protocol/${protocolId}/sign`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ signature_type: signatureType })
        });

        setStatus(response.status);

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Erro ao assinar protocolo');
            return null;
        }

        return data;
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const getProtocol = async (token, protocolId, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/protocol/${protocolId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setStatus(response.status);

        if (!response.ok) {
            const error = await response.json();
            setError(error.message || 'Erro ao obter protocolo');
            return null;
        }

        return await response.json();
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const listProtocols = async (token, filters, setStatus, setError) => {
    try {
        const params = new URLSearchParams();
        if (filters?.state) params.append('state', filters.state);
        if (filters?.calendar) params.append('calendar', filters.calendar);

        const url = `${apiUrl}/protocols${params.toString() ? '?' + params.toString() : ''}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setStatus(response.status);

        if (!response.ok) {
            const error = await response.json();
            setError(error.message || 'Erro ao listar protocolos');
            return null;
        }

        return await response.json();
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const downloadProtocol = async (token, protocolId) => {
    const response = await fetch(`${apiUrl}/protocol/${protocolId}/download`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao descarregar protocolo');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `protocolo_${protocolId}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
};


// Student Registration Management (REQ-11-12)
export const getPendingRegistrations = async (token, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/academic/registrations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setStatus(response.status);

        if (!response.ok) {
            const error = await response.json();
            setError(error.message || 'Erro ao obter registos pendentes');
            return null;
        }

        return await response.json();
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const validateStudentRegistration = async (token, studentNumber, action, calendarId, notes, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/academic/registrations/${studentNumber}/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, calendar_id: calendarId, notes })
        });

        setStatus(response.status);

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Erro ao validar registo');
            return null;
        }

        return data;
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};
