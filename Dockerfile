# File: frontend/Dockerfile
# Dockerfile for Study Assistant AI Frontend (React + Vite)

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json & lock file first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the source code
COPY . .

# Expose Vite dev/preview port
EXPOSE 5173

# Default command: run dev server (for project/demo mode)
# For production you could do: npm run build && use a static server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
