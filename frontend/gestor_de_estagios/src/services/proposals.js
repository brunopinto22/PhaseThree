const apiUrl = process.env.REACT_APP_API_URL;


export async function getProposal(token, id, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/proposal/${id}`, {
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

export async function listProposals(token, setStatus, setErrorMessage, filter = false) {

	try {

		const res = await fetch(`${apiUrl}/proposals${filter ? '?self=true' : ''}`, {
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
		setStatus(500);
		setErrorMessage("Erro de rede ou servidor");
		return [];
	}

}

export async function createProposal(token, data, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/proposal/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
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
      setErrorMessage(responseData.message || "Erro ao criar curso");
      return false;
    }

	} catch (error) {
    setStatus(500);
    setErrorMessage("Erro de rede ou servidor");
    return false;
  }
	
}

export async function editProposal(token, id, data, setStatus, setErrorMessage) {

	try {
		const res = await fetch(`${apiUrl}/proposal/${id}/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
			body: JSON.stringify(data),
    });

		const responseData = await res.json();
		setStatus(res.status)
		setErrorMessage(responseData.message || "Erro ao criar curso");

    if(res.status !== 200)
      return true;

	} catch {
		return false;
	}

	return false;
	
}

export async function deleteProposal(token, id) {

	// TODO : deleteProposal

	try {
		const res = await fetch(`${apiUrl}/scientificArea/${id}/delete`, {
      method: "DELETE",
      headers: {
        "Authorization": token,
      }
    });

		const data = await res.json();

    if(res.status !== 200)
      return true;

	} catch {
		return false;
	}
	
}