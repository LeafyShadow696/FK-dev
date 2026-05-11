# fkdev.xyz Admin API

Python backend scaffold for the private admin portal.

Recommended runtime:

- Python 3.12+
- FastAPI
- Uvicorn
- PostgreSQL for persistent data and audit logs
- External object storage for private files and exports

Local run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Render start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Do not commit `.env` files or provider tokens. Use platform environment variables.
