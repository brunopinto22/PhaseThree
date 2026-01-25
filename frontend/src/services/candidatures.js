const apiUrl = process.env.REACT_APP_API_URL;

export async function getCandidature(token, id, setStatus, setErrorMessage) {
    try {
        const res = await fetch(`${apiUrl}/candidature/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
        });

        const data = await res.json();
        setStatus(res.status);

        if (res.status !== 200) {
            setErrorMessage(data.message || "Erro desconhecido");
            return null;
        }

        return data;

    } catch (error) {
        setStatus(500);
        setErrorMessage("Erro de rede ou servidor");
        return null;
    }
}

export async function listCandidatures(token, setStatus, setErrorMessage) {
    try {
        const res = await fetch(`${apiUrl}/candidatures/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
        });

        const data = await res.json();

        if (setStatus) setStatus(res.status);

        if (res.status !== 200) {
            if (setErrorMessage) setErrorMessage(data.message || "Erro desconhecido");
            return null;
        }

        return data;

    } catch (error) {
        if (setStatus) setStatus(500);
        if (setErrorMessage) setErrorMessage("Erro de rede ou servidor");
        return null;
    }
}

export async function updateCandidatureState(token, id, newState, setStatus, setErrorMessage) {
    try {
        const res = await fetch(`${apiUrl}/candidature/${id}/state`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify({ state: newState })
        });

        const data = await res.json();

        if (setStatus) setStatus(res.status);

        if (res.status !== 200) {
            if (setErrorMessage) setErrorMessage(data.message || "Erro desconhecido");
            return false;
        }

        return true;

    } catch (error) {
        if (setStatus) setStatus(500);
        if (setErrorMessage) setErrorMessage("Erro de rede ou servidor");
        return false;
    }
}

export async function updateCandidatureProposalState(token, proposal_rel_id, newState, setStatus, setErrorMessage) {
    try {
        const res = await fetch(`${apiUrl}/candidature/proposal/${proposal_rel_id}/state`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify({ state: newState })
        });

        const data = await res.json();

        if (setStatus) setStatus(res.status);

        if (res.status !== 200) {
            if (setErrorMessage) setErrorMessage(data.message || "Erro desconhecido");
            return false;
        }

        return true;

    } catch (error) {
        if (setStatus) setStatus(500);
        if (setErrorMessage) setErrorMessage("Erro de rede ou servidor");
        return false;
    }
}
