# Use Python 3.11 as the base image
FROM python:3.11.5

# Set the working directory
WORKDIR /app

# Install system dependencies required for Playwright and Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    # Additional dependencies for better cloud compatibility
    libglib2.0-0 \
    libnss3-dev \
    libx11-xcb1 \
    libgconf-2-4 \
    libdrm2 \
    libxkbcommon0 \
    libxslt1.1 \
    libgtk-3-0 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*  # Clean up

# Upgrade pip, setuptools, and wheel before installing dependencies
RUN pip install --upgrade pip setuptools wheel

# Install Playwright and browser dependencies
RUN pip install --no-cache-dir playwright
RUN playwright install --with-deps chromium
RUN playwright install-deps

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt  # Install packages

# Copy application code
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Start FastAPI with Uvicorn
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "asyncio", "--proxy-headers"]
