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

5. **Create a `.env` file in the backend directory with the following content**:
    ```
    # Database configuration
    DB_NAME="postgres"        # Change to your database name
    DB_USER="postgres"        # Change to your database user
    DB_PASSWORD="teste"       # Change to your database password
    DB_HOST="db"              # Change to your database host (e.g., localhost)
    DB_PORT="5432"            # Change to your database port if different

    # Email configuration
    EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend"  # Usually keep this for SMTP
    EMAIL_HOST="smtp.gmail.com"      # Change to your email provider's SMTP host
    EMAIL_PORT=587                   # Change if your provider uses a different port
    EMAIL_USE_TLS=True               # True if your email provider requires TLS
    EMAIL_HOST_USER="codemeistersgp@gmail.com"  # Your email address for sending
    EMAIL_HOST_PASSWORD="qpvfhvncffnzyypq"     # Your email password or app password

    # JWT configuration
    JWT_SECRET_KEY="my_very_very_secret"  # Change to a strong, secret key

    # Frontend URL
    FRONTEND_URL="http://localhost:3000"  # Change to your frontend deployment URL if needed
    ```
    > **Note:** The FRONTEND_URL should match the URL where your React client is running.

6. **Apply database migrations**:
    ```
    python manage.py migrate
    ```

7. **Run the development server**:
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
