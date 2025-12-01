import subprocess
import atexit

REDIS_CONTAINER_NAME = "redis"

def start_redis_docker():
    """Inicia o Redis via Docker Compose."""
    print("🟢 Starting Redis via Docker...")
    try:
        subprocess.run(["docker", "compose", "up", "-d", REDIS_CONTAINER_NAME], check=True)
    except subprocess.CalledProcessError:
        print("❌ Failed to start Redis via Docker.")
        exit(1)

def stop_redis_docker():
    """Para o container Docker do Redis."""
    print("🛑 Stopping Redis Docker container...")
    try:
        subprocess.run(["docker", "compose", "stop", REDIS_CONTAINER_NAME], check=True)
    except subprocess.CalledProcessError:
        print("❌ Failed to stop Redis container.")

# Registrar stop ao sair
atexit.register(stop_redis_docker)

# Start Redis
start_redis_docker()

processes = []

# Django server
print("🚀 Starting Django server...")
processes.append(subprocess.Popen(["python3", "manage.py", "runserver"]))

# Celery worker (usando solo para Windows)
print("🔹 Starting Celery worker...")
processes.append(subprocess.Popen([
    "celery", "-A", "gestor_estagios", "worker", "-l", "info", "-P", "solo"
]))

# Celery beat (usando solo para Windows)
print("⏰ Starting Celery beat...")
processes.append(subprocess.Popen([
    "celery", "-A", "gestor_estagios", "beat", "-l", "info"
]))

try:
    for p in processes:
        p.wait()
except KeyboardInterrupt:
    print("Stopping all processes...")
    for p in processes:
        p.terminate()
