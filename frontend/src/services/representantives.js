const apiUrl = process.env.REACT_APP_API_URL;

export async function getRepresentative(token, id, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/representative/${id}`, {
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

export async function registerRepresentative(data, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/representative/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
			body: JSON.stringify(data),
    });

		const responseData = await res.json();

		if (res.ok) {
      setStatus(res.status);
      setErrorMessage("");
      return true;

    } else {
      setStatus(res.status);
      setErrorMessage(responseData.message || "Erro ao criar Representante");
      return false;
    }

	} catch (error) {
    setStatus(500);
    setErrorMessage("Erro de rede ou servidor");
    return false;
  }
	
}

export async function editRepresentative(token, id, data, setStatus, setErrorMessage) {
	
	try {
		const res = await fetch(`${apiUrl}/representative/${id}/edit`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"Authorization": token,
			},
			body: JSON.stringify(data),
		});

		const responseData = await res.json();
		setStatus(res.status)
		setErrorMessage(responseData.message || "Erro ao editar aluno");

		if(res.status === 200)
			return true;
		return false;

	} catch {
		return false;
	}

	return false;

}