# Use official Node.js image as base
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend files
COPY ./ .

# Expose port 5173 for the frontend app
EXPOSE 5173

# Run frontend development server
CMD ["npm", "run", "dev"]