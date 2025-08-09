const apiUrl = process.env.REACT_APP_API_URL;


export async function getCourse(token, id, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/course/${id}`, {
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

export async function listCourses(token, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/courses`, {
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

export async function createCourse(token, data, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/course/create`, {
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

export async function editCourse(token, id, data, setStatus, setErrorMessage) {

	try {
		const res = await fetch(`${apiUrl}/course/${id}/edit`, {
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

export async function deleteCourse(token, id) {
	
	try {
		const res = await fetch(`${apiUrl}/course/${id}/delete`, {
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
	
	return false;

}



export async function getScientificAreas() {
	
	try {

		const res = await fetch(`${apiUrl}/scientificAreas/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if(res.status !== 200)
      return [];

    return data;

  } catch (error) {
    return [];
  }

}

export async function addScientificArea(token, name) {

	try {

		const res = await fetch(`${apiUrl}/scientificArea/add`, {
      method: "POST",
      headers: {
				"Content-Type": "application/json",
        "Authorization": token,
      },
			body: JSON.stringify({ name: name }),
    });

		const data = await res.json();

    if(res.status !== 200)
      return true;

	} catch {
		return false;
	}
	
}

export async function deleteScientificArea(token, id) {

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