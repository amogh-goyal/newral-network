from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import asyncio
import uuid
from main import generate_roadmap
from fastapi.middleware.cors import CORSMiddleware
from ourgpt import router as gpt_router

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite's default port
        "http://localhost:3001",  # React port
        "https://connecthub-dot-gdg-newral-network.uc.r.appspot.com",  # Replace with your GCP URL
        "https://YOUR-DOMAIN.com" ,
        "*" # Replace with your actual domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the GPT router
app.include_router(gpt_router, tags=["chatbot"])

# In-memory storage for jobs (use Redis or a database in production)
jobs = {}

class RoadmapRequest(BaseModel):
    degree: str
    country: str | None = None
    language: str = "en"
    include_paid: bool = True
    preferred_language: str | None = None

@app.post("/generate-roadmap")
async def start_generation(request: RoadmapRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "processing"}
    background_tasks.add_task(run_generation, job_id, request)
    return {"job_id": job_id}

async def run_generation(job_id: str, request: RoadmapRequest):
    try:
        roadmap = await generate_roadmap(
            degree=request.degree,
            country=request.country,
            language=request.language,
            include_paid=request.include_paid,
            preferred_language=request.preferred_language
        )
        jobs[job_id] = {"status": "completed", "result": roadmap}
    except Exception as e:
        jobs[job_id] = {"status": "failed", "error": str(e)}

@app.get("/roadmap/{job_id}")
async def get_roadmap(job_id: str):
    job = jobs.get(job_id)
    if not job:
        return {"error": "Job not found"}
    if job["status"] == "processing":
        return {"status": "processing"}
    elif job["status"] == "completed":
        return job["result"]
    else:
        return {"status": "failed", "error": job["error"]}

# Run with: uvicorn api:app --reload