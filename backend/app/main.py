from fastapi import FastAPI

app = FastAPI(title="LENS API")


@app.get("/health")
def health():
    return {"status": "ok"}

# Source: https://docs.docker.com/guides/python
# Source: https://fastapi.tiangolo.com/#installation