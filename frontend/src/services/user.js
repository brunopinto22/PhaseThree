const apiUrl = process.env.REACT_APP_API_URL;


export async function setUserPassword(token, data, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/user/password/set`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
			body: JSON.stringify(data),
    });

    const response = await res.json();
		setStatus(res.status);

    if(res.status !== 200) {
      setErrorMessage(response.message || "Erro desconhecido");
      return false;
    }

    return true;

  } catch (error) {
    setErrorMessage("Erro de rede ou servidor");
    return false;
  }

}


export async function getSummary(token, setStatus, setErrorMessage) {

	try {

		const res = await fetch(`${apiUrl}/user/summary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
    });

    const response = await res.json();
		setStatus(res.status);

    if(res.status !== 200) {
      setErrorMessage(response.message || "Erro desconhecido");
      return null;
    }

    return response;

  } catch (error) {
    setErrorMessage("Erro de rede ou servidor");
    return null;
  }

} 