const apiUrl = process.env.REACT_APP_API_URL;


export async function getCalendar(token, id, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/calendar/${id}`, {
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

export async function createCalendar(token, data, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/calendar/create`, {
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

export async function editCalendar(token, id, data, setStatus, setErrorMessage) {

	try {
		const res = await fetch(`${apiUrl}/calendar/${id}/edit`, {
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

export async function deleteCalendar(token, id) {

	// TODO : deleteCalendar

	try {
		const res = await fetch(`${apiUrl}/scientificArea/${id}/delete`, {
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
	
}