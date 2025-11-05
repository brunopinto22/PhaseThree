<img src="./assets/imgs/logo.png" alt="ISEC Logo" width="25%" />

# ISEC Internship and Project Partnerships Management System

This project was developed as the final degree project for my Bachelor's in Computer Engineering at Instituto Superior de Engenharia de Coimbra (ISEC). It aims to provide a centralized digital platform that manages and monitors partnerships between ISEC and external companies, covering the entire process from internship and research project proposals to student applications and placements.


## 🎯 Motivation

The management of internships and project partnerships at ISEC has traditionally been handled in a fragmented way, which can make accessing relevant information and maintaining administrative efficiency challenging. This project was developed to address these issues by proposing a unified and streamlined solution aimed at improving communication, oversight, and transparency among students, academic staff, and partner organizations. While the system is designed with these goals in mind, its adoption and use within the institution will depend on future decisions and evaluations.


## 🏗️ Project Structure

The system is composed of two main applications:

- **Backend API**: A RESTful API responsible for data management, user authentication, and business logic.
- **Frontend Application**: A web interface that communicates with the API, providing different dashboards and functionalities tailored to various user roles.

This separation allows for a clear division between data handling and user interaction, facilitating maintainability and scalability.


## 🛠️ Technology Stack

- **Frontend**: [React](https://reactjs.org/) 18.3, Bootstrap 5, HTML, CSS, JavaScript
- **Backend**: [Django](https://www.djangoproject.com/) 5.2, Django REST Framework, Python 3.12
- **Database**: PostgreSQL 16, SQLite3 (dev)
- **Task Queue**: Celery 5.3+ with Redis
- **Authentication**: JWT (PyJWT)
- **Web Server**: Nginx, Gunicorn
- **Containerization**: Docker & Docker Compose
- **Document Generation**: docxtpl, openpyxl
- **Design**: [Figma](https://www.figma.com/)


## 📚 Documentation

### Project Documentation

All project documentation is available in the `assets/docs` directory. The folder contains the following files:

- **Relatório** – Final project report, covering the entire development process, architecture, results, and conclusions.  
- **Proposta** – Formal document of the initial project proposal.  
- **Funcionalidades** – Functional requirements using the MoSCoW notation, including their final implementation status.  
- **Endpoints** – Complete documentation of all system endpoints and their implementation state.  
- **Design da Interface** – Documentation of the application's design and interface structure.

## 🚀 How to Run

### 🐳 Docker (Recommended)

The easiest way to run the entire system is using Docker:

```bash
# Clone the repository
git clone <repository-url>
cd PhaseThree

# Build and start all services
docker-compose up -d --build

# Access the application at http://localhost
```

📖 **For detailed Docker setup instructions, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)**

**Default Login:**
- Username: `admin@localhost.pt`
- Password: `admin123`

**Access Points:**
- Frontend: http://localhost
- Backend API: http://localhost/api/
- Admin Panel: http://localhost/admin/

### 💻 Manual Setup (Development)

This project consists of two main applications: the Backend API and the Frontend Application. Each has its own setup and running instructions detailed in their respective directories.

- For instructions on setting up and running the **Frontend Application**, please see the [Frontend README](./frontend/README.md).
- For instructions on setting up and running the **Backend API**, please refer to the [Backend README](./backend/README.md).