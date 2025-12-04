const apiUrl = process.env.REACT_APP_API_URL || '/api';


export async function submitCandidature(token, proposals, setStatus, setErrorMessage) {
    try {
        const res = await fetch(`${apiUrl}/candidature/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify({ proposals }),
        });

        const data = await res.json();
        setStatus(res.status);

        if (res.status === 201) {
            setErrorMessage("");
            return data;
        }

        setErrorMessage(data.message || "Erro ao submeter candidatura");
        return null;

    } catch (error) {
        setStatus(500);
        setErrorMessage("Erro de rede ou servidor");
        return null;
    }
}


export async function getStudentCandidature(token, setStatus, setErrorMessage) {
    try {
        const res = await fetch(`${apiUrl}/candidature/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
        });

        const data = await res.json();
        setStatus(res.status);

        if (res.status === 200) {
            return data;
        }

        setErrorMessage(data.message || "Erro desconhecido");
        return null;

    } catch (error) {
        setStatus(500);
        setErrorMessage("Erro de rede ou servidor");
        return null;
    }
}


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

        if (res.status === 200) {
            return data;
        }

        setErrorMessage(data.message || "Erro desconhecido");
        return null;

    } catch (error) {
        setStatus(500);
        setErrorMessage("Erro de rede ou servidor");
        return null;
    }
}


export async function updateCandidature(token, id, proposals, setStatus, setErrorMessage) {
    try {
        const res = await fetch(`${apiUrl}/candidature/${id}/edit`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify({ proposals }),
        });

        const data = await res.json();
        setStatus(res.status);

        if (res.status === 200) {
            setErrorMessage("");
            return true;
        }

        setErrorMessage(data.message || "Erro ao atualizar candidatura");
        return false;

    } catch (error) {
        setStatus(500);
        setErrorMessage("Erro de rede ou servidor");
        return false;
    }
}


export async function listCandidatures(token, calendarId, setStatus, setErrorMessage) {
    try {
        let url = `${apiUrl}/candidatures`;
        if (calendarId) {
            url += `?calendar=${calendarId}`;
        }

        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
        });

        if (res.status === 204) {
            setStatus(res.status);
            return [];
        }

        const data = await res.json();
        setStatus(res.status);

        if (res.status === 200) {
            return data;
        }

        setErrorMessage(data.message || "Erro desconhecido");
        return null;

    } catch (error) {
        setStatus(500);
        setErrorMessage("Erro de rede ou servidor");
        return null;
    }
}


export async function deleteCandidature(token, id, setStatus, setErrorMessage) {
    try {
        const res = await fetch(`${apiUrl}/candidature/${id}/delete`, {
            method: "DELETE",
            headers: {
                "Authorization": token,
            },
        });

        const data = await res.json();
        setStatus(res.status);

        if (res.status === 200) {
            return true;
        }

        setErrorMessage(data.message || "Erro ao eliminar candidatura");
        return false;

    } catch (error) {
        setStatus(500);
        setErrorMessage("Erro de rede ou servidor");
        return false;
    }
}

