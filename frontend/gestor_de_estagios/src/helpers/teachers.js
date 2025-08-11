const apiUrl = process.env.REACT_APP_API_URL;

export async function getTeacher(token, id, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/teacher/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
    });

    const data = await res.json();
    setStatus(res.status);

    if(res.status !== 200) {
      setErrorMessage(
				data.message ||
				data.error ||
				data.detail || 
				data.details ||
				"Erro desconhecido"
			);
      return null;
    }

    return data;

  } catch (error) {
    setStatus(500);
		setErrorMessage("Erro de rede ou servidor");
    return null;
  }
	
}

export async function listTeachers(token, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/teachers/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
    });

    const data = await res.json();
    setStatus(res.status);

    if(res.status !== 200) {
      setErrorMessage(
				data.message ||
				data.error ||
				data.detail || 
				data.details ||
				"Erro desconhecido"
			);
      return [];
    }

    return data;

  } catch (error) {
    setStatus(500);
		setErrorMessage("Erro de rede ou servidor");
    return [];
  }
	
}

export async function createTeacher(token, data, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/teacher/create`, {
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
      setStatus(res.status);
			setErrorMessage(
				responseData.message ||
				responseData.error ||
				responseData.detail || 
				responseData.details ||
				"Erro desconhecido"
			);
      return true;

    } else {
      setStatus(res.status);
      setStatus(res.status);
			setErrorMessage(
				responseData.message ||
				responseData.error ||
				responseData.detail || 
				responseData.details ||
				"Erro desconhecido"
			);
      return false;
    }

	} catch (error) {
    setStatus(500);
    setErrorMessage("Erro de rede ou servidor");
    return false;
  }
	
}

export async function editTeacher(token, id, data, setStatus, setErrorMessage) {

	try {
		const res = await fetch(`${apiUrl}/teacher/${id}/edit`, {
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

export async function deleteTeacher(token, id) {
	
	try {
		const res = await fetch(`${apiUrl}/teacher/${id}/delete`, {
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