# Stage 1: Build the React/Vite application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Accept the API key as a build argument and set it as an environment variable
# so Vite can access it during the build process to replace process.env.GEMINI_API_KEY
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Build the frontend application
RUN npm run build

# Stage 2: Serve the application using a lightweight web server (Nginx)
FROM nginx:alpine

# Clean default Nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace the default Nginx configuration with our custom SPA config
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Nginx defaults to 80)
EXPOSE 80

# Keep Nginx running in the foreground
CMD ["nginx", "-g", "daemon off;"]