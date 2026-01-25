const apiUrl = process.env.REACT_APP_API_URL;

/**
 * Validate (approve/reject) a student
 * @param {string} token - Auth token
 * @param {number} studentNumber - Student number
 * @param {string} action - 'approve' or 'reject'
 * @param {string} rejectionReason - Required if action is 'reject'
 */
export async function validateStudent(token, studentNumber, action, rejectionReason = '') {
    try {
        const res = await fetch(`${apiUrl}/student/${studentNumber}/validate`, {
            method: 'PUT',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action,
                rejection_reason: rejectionReason
            })
        });

        const data = await res.json();

        if (res.status !== 200) {
            throw new Error(data.message || 'Erro ao validar estudante');
        }

        return data;
    } catch (error) {
        console.error('Error validating student:', error);
        throw error;
    }
}

/**
 * Get list of pending students (validation_status = 'pending')
 * @param {string} token - Auth token
 * @returns {Promise<Array>} List of pending students
 */
export async function listPendingStudents(token) {
    try {
        const res = await fetch(`${apiUrl}/students/pending`, {
            method: 'GET',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        if (res.status !== 200) {
            throw new Error(data.message || 'Erro ao obter estudantes pendentes');
        }

        return data;
    } catch (error) {
        console.error('Error fetching pending students:', error);
        throw error;
    }
}
