# Use official Node.js image as base
FROM node:20

# Set working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy all backend files
COPY backend/ ./

# Expose port 3000 for the backend app
EXPOSE 3001

# Run the backend application
CMD ["node", "index.js"]