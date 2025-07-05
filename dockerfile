# ---------- Build Stage ----------
    FROM node:20 AS builder
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    RUN npm run build  # Builds the Vite app into /app/dist
    
    # ---------- Serve Stage ----------
    FROM nginx:stable-alpine
    
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    