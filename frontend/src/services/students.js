const apiUrl = process.env.REACT_APP_API_URL;


export async function getStudent(token, id, setStatus, setErrorMessage) {
	
	try {
    const res = await fetch(`${apiUrl}/student/${id}`, {
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
    setStatus(500);
    setErrorMessage("Erro de rede ou servidor");
    return null;
  }

}

export async function listStudents(token, setStatus, setErrorMessage) {

	try {
    const res = await fetch(`${apiUrl}/students/`, {
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
    setStatus(500);
    setErrorMessage("Erro de rede ou servidor");
    return null;
  }

}

export async function registerStudent(data, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/student/register`, {
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
      setErrorMessage(responseData.message || "Erro ao criar Aluno");
      return false;
    }

	} catch (error) {
    setStatus(500);
    setErrorMessage("Erro de rede ou servidor");
    return false;
  }
	
}

export async function createStudent(token, data, setStatus, setErrorMessage) {
	
	try {

		const res = await fetch(`${apiUrl}/student/create`, {
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
      setErrorMessage(responseData.message || "Erro ao criar Aluno");
      return false;
    }

	} catch (error) {
    setStatus(500);
    setErrorMessage("Erro de rede ou servidor");
    return false;
  }

}

export async function editStudent(token, id, data, setStatus, setErrorMessage) {

	try {
		const res = await fetch(`${apiUrl}/student/${id}/edit`, {
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

export async function deleteStudent(token, id, setStatus, setErrorMessage) {
	
	try {
		const res = await fetch(`${apiUrl}/student/${id}/delete`, {
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

export async function addFavourite(token, id) {
	
	try {

		const res = await fetch(`${apiUrl}/student/favorite/add/${id}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": token,
			}
		});

		const responseData = await res.json();

	} catch {}

}

export async function removeFavourite(token, id) {
	
	try {

		const res = await fetch(`${apiUrl}/student/favorite/remove/${id}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"Authorization": token,
			}
		});

		const responseData = await res.json();

	} catch {}

}