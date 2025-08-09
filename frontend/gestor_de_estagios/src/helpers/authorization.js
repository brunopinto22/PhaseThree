export async function authorization(authorizedRoles) {
    const access_token = localStorage.getItem("access_token");

    const apiUrl = process.env.REACT_APP_API_URL;

    if (!access_token) {
        console.error("No access token found.");

        return false;
    }

    try {
        const response = await fetch(`${apiUrl}test_token/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `${access_token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 403) {
                console.error("Unauthorized. Redirecting to login.");
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user_email");
                localStorage.removeItem("profile_photo");
            } else {
                console.error("Error:", response.statusText);
            }

            return false;
        }

        const data = await response.json();

        console.log("Data fetched successfully:", data);

        // TODO: check if token role is contained in authorizedRoles
        //verify if the token role is in the authorizedRoles array
        if (
            !Array.isArray(authorizedRoles) ||
            !authorizedRoles.includes(data.user_type)
        ) {
            console.error("Unauthorized role.");

            return false;
        }

        return true;
    } catch (error) {
        console.error("Error fetching data:", error);

        return false;
    }
}