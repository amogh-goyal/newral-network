from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import asyncio
import uuid
import json
import traceback
from copy import deepcopy
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
        "https://mern-app-backend-477609894648.asia-south2.run.app",  # Backend URL
        "https://mern-app-fastapi-477609894648.us-central1.run.app",  # FastAPI URL
        "https://newral-network.vercel.app"  # Replace with your Vercel domain once deployed
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the GPT router
app.include_router(gpt_router, tags=["chatbot"])

# In-memory storage for jobs (use Redis or a database in production)
jobs = {}

def convert_to_serializable(obj):
    """Convert any object to a JSON serializable format"""
    if isinstance(obj, dict):
        return {str(k): convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list) or isinstance(obj, tuple):
        return [convert_to_serializable(item) for item in obj]
    elif isinstance(obj, (int, float, str, bool)) or obj is None:
        return obj
    else:
        return str(obj)

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
    # First, set the job status to processing
    jobs[job_id] = {"status": "processing"}
    
    try:
        # Call the roadmap generation function
        roadmap = await generate_roadmap(
            degree=request.degree,
            country=request.country,
            language=request.language,
            include_paid=request.include_paid,
            preferred_language=request.preferred_language
        )
        
        # Create a completely new dictionary to avoid reference issues
        safe_roadmap = {}
        
        # Safely transfer and convert values to ensure serializability
        if isinstance(roadmap, dict):
            # Start with basic fields - match exact format requested
            safe_roadmap["title"] = str(roadmap.get("title", f"Path to {request.degree}"))
            safe_roadmap["description"] = str(roadmap.get("description", "Your learning roadmap"))
            safe_roadmap["topic"] = str(roadmap.get("topic", request.degree.split()[0].lower()))
            safe_roadmap["selected_option"] = str(roadmap.get("selected_option", "1"))
            
            # Handle options list carefully
            safe_roadmap["options"] = []
            if "options" in roadmap and isinstance(roadmap["options"], list):
                for option in roadmap["options"]:
                    safe_option = {}
                    # Copy option data safely
                    if isinstance(option, dict):
                        safe_option["option_id"] = str(option.get("option_id", "1"))
                        safe_option["option_name"] = str(option.get("option_name", "Option"))
                        
                        # Handle topics list
                        safe_option["topics"] = []
                        if "topics" in option and isinstance(option["topics"], list):
                            for topic in option["topics"]:
                                if isinstance(topic, dict):
                                    safe_topic = {}
                                    # Copy all topic fields as strings
                                    for k, v in topic.items():
                                        safe_topic[str(k)] = str(v) if v is not None else ""
                                    safe_option["topics"].append(safe_topic)
                        
                        safe_roadmap["options"].append(safe_option)
            
            # Debug - check for YouTube content before returning result
            youtube_count = 0
            for option in safe_roadmap.get("options", []):
                for topic in option.get("topics", []):
                    if "platform" in topic and topic["platform"] == "YouTube":
                        youtube_count += 1
            
            print(f"Final roadmap contains {youtube_count} YouTube resources")
            
            # Store the safely constructed roadmap
            jobs[job_id] = {"status": "completed", "result": safe_roadmap}
        else:
            print("Generated roadmap is not a dictionary")
            jobs[job_id] = {"status": "failed", "error": "Invalid roadmap structure generated"}
    
    except Exception as e:
        print(f"Error generating roadmap: {str(e)}")
        traceback.print_exc()
        jobs[job_id] = {"status": "failed", "error": str(e)}

@app.get("/roadmap/{job_id}")
async def get_roadmap(job_id: str):
    try:
        # Get job information
        job = jobs.get(job_id)
        if not job:
            return JSONResponse(content={"error": "Job not found"})
        
        # Handle different job statuses
        if job["status"] == "processing":
            return JSONResponse(content={"status": "processing"})
        elif job["status"] == "completed" and "result" in job:
            # Return the pre-sanitized result
            return JSONResponse(content=job["result"])
        else:
            # Handle error case
            error_msg = job.get("error", "Unknown error occurred")
            return JSONResponse(content={"status": "failed", "error": error_msg})
            
    except Exception as e:
        print(f"Error retrieving roadmap: {str(e)}")
        traceback.print_exc()
        # Always return a valid response
        return JSONResponse(content={"status": "failed", "error": "Internal server error"})
