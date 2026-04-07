# Stage 1: Build the React/Vite application
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build the Node.js backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install
COPY server/ ./
RUN npm run build

# Stage 3: Setup the production environment
FROM node:20-alpine
WORKDIR /app

# Copy the frontend dist folder
COPY --from=frontend-builder /app/dist ./dist

# Copy the backend dist and package mapping
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/package*.json ./server/

# Install only production dependencies for the backend
WORKDIR /app/server
RUN npm install --production

# Allow the port to be configured
ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/index.js"]
