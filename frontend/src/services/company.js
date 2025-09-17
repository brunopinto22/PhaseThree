const apiUrl = process.env.REACT_APP_API_URL;

export async function registerCompany(data, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/company/register`, {
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
      setErrorMessage(responseData.message || "Erro ao criar Empresa");
      return false;
    }

	} catch (error) {
    setStatus(500);
    setErrorMessage("Erro de rede ou servidor");
    return false;
  }

}


export async function getCompany(token, id, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/company/${id}`, {
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


export async function listCompanies(token, setStatus, setErrorMessage) {
	
	try {

		const res = await fetch(`${apiUrl}/companies`, {
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

export async function editCompany(token, id, data, setStatus, setErrorMessage) {

	try {
		const res = await fetch(`${apiUrl}/company/${id}/edit`, {
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

    if(res.status === 200)
      return true;

	} catch {
		return false;
	}

	return false;
	
}

export async function deleteCompany(token, id, setStatus, setErrorMessage) {
	
	try {
		const res = await fetch(`${apiUrl}/company/${id}/delete`, {
      method: "DELETE",
      headers: {
        "Authorization": token,
      }
    });

		const data = await res.json();

    if(res.status === 200)
      return true;

	} catch {
		return false;
	}
	
	return false;

}

export async function invite(token, email, setStatus, setErrorMessage) {

	try {
		const res = await fetch(`${apiUrl}/company/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
			body: JSON.stringify({
				email: email
			})
    });

		const responseData = await res.json();
		setStatus(res.status)
		setErrorMessage(responseData.message || "Erro ao convidar o representante");

    if(res.status === 200)
      return true;

	} catch {
		return false;
	}

	return false;

}