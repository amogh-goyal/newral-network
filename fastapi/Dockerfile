FROM python:3.11.5

# Set the working directory
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright and its browser dependencies, as in the multi-stage Dockerfile
RUN playwright install --with-deps

# Copy the rest of the application code
COPY . .


# Expose the FastAPI port, as specified in the multi-stage Dockerfile
EXPOSE 8000

# Start FastAPI using Uvicorn, matching the command in the multi-stage Dockerfile
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "asyncio", "--proxy-headers"]