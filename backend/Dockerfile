# Backend Dockerfile
FROM python:3.11-slim AS backend
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY /gestor_estagios ./

# Expose backend port
EXPOSE 8000

# Default command to start the backend
CMD ["sh", "-c", "python manage.py makemigrations && python manage.py migrate && python add_admin.py && python manage.py runserver 0.0.0.0:8000"]
