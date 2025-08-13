###### ISEC Internship and Project Partnerships Management System
# Backend

This application serves as the backend of the ISEC Internship and Project Partnerships Management System. It is built with Django and Python and provides all the data management, authentication, and business logic for the frontend application.


## 🛠️ Technology Stack

- [Django](https://www.djangoproject.com/)
- Python


## 🚀 How to Run

1. **Clone the repository** (or navigate to the `backend` directory if you already have the project):
    ```
    git clone <your-repo-url>
    cd <repo-root>/backend
    ```

2. **Create a virtual environment**:
    ```
    python -m venv venv
    ```

3. **Activate the virtual environment**:
- On macOS/Linux:
    ```
    source venv/bin/activate
    ```
    
- On Windows (Command Prompt):
    ```
    venv\Scripts\activate
    ```

4. **Install dependencies**:
    ```
    pip install -r requirements.txt
    ```

5. **Apply database migrations**:
    ```
    python manage.py migrate
    ```

6. **Run the development server**:
    ```
    python manage.py runserver
    ```
    > **Note:** After running this command, Django will display the URL where the API is running. This URL should be used in the frontend's `.env` file **with `/api` appended** as the API base URL.
    > For example:  
    > `REACT_APP_API_URL=http://127.0.0.1:8000/api`


## 👤 Admin Access

After running the migrations and starting the server, a default superuser is automatically created with the following credentials (as defined in `api/apps.py`):

- **Username:** admin
- **Email:** admin@localhost.pt
- **Password:** admin123

For security reasons, it is strongly recommended to change the default password as soon as possible, preferably using the frontend. You can update the credentials by logging in on the frontend and accessing the settings.

You can still log in to the Django admin panel at `http://localhost:8000/admin`, but managing the admin account via the frontend is preferred.
