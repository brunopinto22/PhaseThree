const apiUrl = process.env.REACT_APP_API_URL || '/api';


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

		if(res.status !== 200) {
			setErrorMessage(data.message || "Erro desconhecido");
			return null;
		}

		return data;

	} catch (error) {
		setErrorMessage("Erro de rede ou servidor");
		return null;
	}
}


export async function listCandidatures(token, setStatus, setErrorMessage, filters = {}) {
	try {
		const queryParams = new URLSearchParams();
		if (filters.state) queryParams.append('state', filters.state);
		if (filters.calendar) queryParams.append('calendar', filters.calendar);

		const url = `${apiUrl}/candidatures${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

		const res = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Authorization": token,
			},
		});

		const data = await res.json();
		setStatus(res.status);

		if(res.status !== 200) {
			setErrorMessage(data.message || "Erro desconhecido");
			return [];
		}

		return data;

	} catch (error) {
		setErrorMessage("Erro de rede ou servidor");
		return [];
	}
}


export async function createCandidature(token, proposals, setStatus, setErrorMessage) {
	try {
		const res = await fetch(`${apiUrl}/candidature/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": token,
			},
			body: JSON.stringify({ proposals }),
		});

		const data = await res.json();
		setStatus(res.status);

		if(res.status !== 201) {
			setErrorMessage(data.message || "Erro desconhecido");
			return null;
		}

		return data;

	} catch (error) {
		setErrorMessage("Erro de rede ou servidor");
		return null;
	}
}


export async function updateCandidatureState(token, id, state, setStatus, setErrorMessage) {
	try {
		const res = await fetch(`${apiUrl}/candidature/${id}/state`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"Authorization": token,
			},
			body: JSON.stringify({ state }),
		});

		const data = await res.json();
		setStatus(res.status);

		if(res.status !== 200) {
			setErrorMessage(data.message || "Erro desconhecido");
			return false;
		}

		return true;

	} catch (error) {
		setErrorMessage("Erro de rede ou servidor");
		return false;
	}
}


export async function updateCandidatureProposalState(token, candidatureId, proposalId, state, setStatus, setErrorMessage) {
	try {
		const res = await fetch(`${apiUrl}/candidature/${candidatureId}/proposal/${proposalId}/state`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"Authorization": token,
			},
			body: JSON.stringify({ state }),
		});

		const data = await res.json();
		setStatus(res.status);

		if(res.status !== 200) {
			setErrorMessage(data.message || "Erro desconhecido");
			return false;
		}

		return true;

	} catch (error) {
		setErrorMessage("Erro de rede ou servidor");
		return false;
	}
}
