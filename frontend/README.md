###### ISEC Internship and Project Partnerships Management System
# Frontend

This is the **frontend** application of the ISEC Internship and Project Partnerships Management System, developed using React.  
It provides the interactive web interface that allows students, academic staff, and partner organizations to access and manage information about internships and research projects.  
The frontend communicates with the backend API to display data, handle user interactions, and provide tailored dashboards for each role.



## 🛠️ Technology Stack

- [React](https://reactjs.org/) – Core framework for building the user interface
- [Bootstrap](https://getbootstrap.com/) – Prebuilt UI components and responsive grid system


## 🚀 How to Run

1. **Clone the repository** (or navigate to the `frontend` directory if you already have the project):
    ```
    git clone <your-repo-url>
    cd <repo-root>/frontend
    ```

2. **Install dependencies** using npm or yarn:
    ```bash
    npm install
    # or
    yarn install
    ```

3. **Configure environment variables**:  
    Create a `.env` file in the project root and define the necessary environment variables.  
    Example:
    ```env
    REACT_APP_API_URL=http://localhost:8000/api
    ```
    > **Note:** The URL should match the one displayed when you run the Django backend server, with `/api` appended. For example, if the backend runs at `http://127.0.0.1:8000/`, the frontend API URL should be `http://127.0.0.1:8000/api`.

4. **Start the application**:  
    Run the following command to start the development server:  
    ```bash
    npm start
    ```