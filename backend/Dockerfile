# Use the same Node.js version as in your multi-stage Dockerfile
FROM node:22.14.0

# Set the working directory
WORKDIR /app/backend

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Set environment variables for production, matching the multi-stage Dockerfile
ENV NODE_ENV=production
ENV BACKEND_PORT=3001

# Expose the backend port, as specified in the multi-stage Dockerfile
EXPOSE 3001

# Start the backend server, matching the command in the multi-stage Dockerfile
CMD ["node", "index.js"]