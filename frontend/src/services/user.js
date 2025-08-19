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


export async function changePfp(token, email, file, setStatus, setErrorMessage) {

  if (!file) {
    setErrorMessage("Nenhum ficheiro selecionado");
    return false;
  }

  const formData = new FormData();
  formData.append("pfp", file);
	formData.append("email", email);
	
  try {
    const res = await fetch(`${apiUrl}/user/changePfp`, {
      method: "PATCH",
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const data = await res.json();
    setStatus(res.status);

    if (!res.ok) {
      setErrorMessage(data.message || "Erro ao alterar foto de perfil");
    }

    return data;
  } catch (err) {
    setStatus(500);
    setErrorMessage("Erro de rede");
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