const apiUrl = process.env.REACT_APP_API_URL;


export const login = async (navigate, email, password, setErrorMessage) => {
  setErrorMessage("");

  try {

    const response = await fetch(`${apiUrl}/user/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: email,
				password: password,
			}),
    });

    const data = await response.json();

    if (response.status === 200) {
			const { access_token, refresh_token, id, type, company_id, valid, message, permissions } = data;

			localStorage.setItem("access_token", access_token);
			localStorage.setItem("refresh_token", refresh_token);
			localStorage.setItem("user_id", id);
			localStorage.setItem("user_role", type);
			localStorage.setItem("user_perms", JSON.stringify(permissions));
			localStorage.setItem("company_id", JSON.stringify(company_id));

			// TODO : mudar depois de acordo com a BD de imagens
			localStorage.setItem("profile_photo", "/photo_UdR5Msk.jpg");

			return true;

    } else {
      setErrorMessage(data.message || "Erro desconhecido");
			return false;
    }
  } catch (err) {
		setErrorMessage( "Algum erro ocorreu.Por favor, tente novamente.");
    console.error("Error:", err);
		return false;
  }
}

export const testToken = async (token) => {

	try {

		const response = await fetch(`${apiUrl}/token/test`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
        "Authorization": token,
			}
    });

		return response.status === 200;

	} catch (err) {
		return false;
  }

}