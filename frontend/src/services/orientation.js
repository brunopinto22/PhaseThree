const apiUrl = process.env.REACT_APP_API_URL || '/api';

export const getMyStudents = async (token, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/orientation/my-students`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setStatus(response.status);

        if (response.status === 204) {
            return [];
        }

        if (!response.ok) {
            const error = await response.json();
            setError(error.message || 'Erro ao obter alunos');
            return null;
        }

        return await response.json();
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const getCalendarOrientations = async (token, calendarId, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/orientation/calendar/${calendarId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setStatus(response.status);

        if (!response.ok) {
            const error = await response.json();
            setError(error.message || 'Erro ao obter orientações');
            return null;
        }

        return await response.json();
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const reassignAdvisor = async (token, proposalId, advisorId, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/orientation/proposal/${proposalId}/advisor`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ advisor_id: advisorId })
        });

        setStatus(response.status);

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Erro ao reatribuir orientador');
            return null;
        }

        return data;
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};

export const triggerOrientationAssignment = async (token, calendarId, setStatus, setError) => {
    try {
        const response = await fetch(`${apiUrl}/orientation/calendar/${calendarId}/assign`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setStatus(response.status);

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || data.error || 'Erro ao executar atribuições');
            return null;
        }

        return data;
    } catch (error) {
        setError('Erro de rede ou servidor');
        return null;
    }
};
