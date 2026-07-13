from fastapi import FastAPI

from app.api.incidents import router as incidents_router
from app.api.lens import router as lens_router
from app.api.neighborhoods import router as neighborhoods_router

app = FastAPI(title="LENS API")

app.include_router(incidents_router)
app.include_router(neighborhoods_router)
app.include_router(lens_router)


@app.get("/health")
def health():
    return {"status": "ok"}
