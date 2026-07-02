from fastapi import FastAPI

app = FastAPI(title="LENS API")


@app.get("/health")
def health():
    return {"status": "ok"}
