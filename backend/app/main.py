from fastapi import FastAPI
from app.routers import incidents

app = FastAPI(title="LENS API")

app.include_router(incidents.router)

@app.get("/health")
def health():
    return {"status": "ok"}