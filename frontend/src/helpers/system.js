const apiUrl = process.env.REACT_APP_API_URL;


export async function getSupportEmail() {

	try {

		const res = await fetch(`${apiUrl}/system/supportEmail`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return data;

	} catch {
		return process.env.REACT_APP_SUPPORT_EMAIL;
	}
	
}