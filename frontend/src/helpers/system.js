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

export async function getCounts() {

	try {

		const res = await fetch(`${apiUrl}/system/counts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return data;

	} catch {
		return {
			nCourses: 0,
			nTeachers: 0,
			nStudents: 0,
			nCompanies: 0,
			nRepresentatives: 0,
		};
	}
	
}