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
      return responseData.id;

    } else {
      setStatus(res.status);
      setErrorMessage(responseData.message || "Erro ao criar curso");
      return -1;
    }

	} catch (error) {
    setStatus(500);
    setErrorMessage("Erro de rede ou servidor");
    return -1;
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
		setErrorMessage(responseData.message || "Erro ao editar proposta");

    if(res.status === 200)
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

    if(res.status === 200)
      return true;

	} catch {
		return false;
	}

	return false;
	
}

export async function getPdf(token, id) {
  try {
    const res = await fetch(`${apiUrl}/proposal/${id}/pdf`, {
      method: "GET",
      headers: {
        "Authorization": token,
      }
    });

    if (!res.ok) throw new Error("Erro ao buscar PDF");

    const disposition = res.headers.get("Content-Disposition");
    let filename = `proposal_${id}.pdf`;

    if (disposition && disposition.includes("filename=")) {
      filename = disposition
        .split("filename=")[1]
        .replace(/['"]/g, "");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Falha ao gerar PDF:", err);
  }

}