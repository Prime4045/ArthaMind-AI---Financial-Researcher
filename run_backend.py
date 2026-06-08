import subprocess
import sys
import os

def start_backend():
    print("==================================================")
    print("STARTING FASTAPI BACKEND SERVER")
    print("==================================================")
    
    # Configure the working directory and PYTHONPATH
    cwd = os.path.dirname(os.path.abspath(__file__))
    env = os.environ.copy()
    env["PYTHONPATH"] = cwd
    
    # Check if virtual env is active or use the venv pip/python executable
    python_path = os.path.join(cwd, "venv", "Scripts", "python.exe")
    if not os.path.exists(python_path):
        python_path = sys.executable  # Fallback to system python if venv not found
        
    try:
        # Run uvicorn backend.main:app --reload --reload-dir backend --host 127.0.0.1 --port 8000
        subprocess.run(
            [python_path, "-m", "uvicorn", "backend.main:app", "--reload", "--reload-dir", "backend", "--host", "127.0.0.1", "--port", "8000"],
            cwd=cwd,
            env=env,
            check=True
        )
    except KeyboardInterrupt:
        print("\nBackend server stopped by user.")
    except Exception as e:
        print(f"Error starting backend server: {str(e)}")

if __name__ == "__main__":
    start_backend()
