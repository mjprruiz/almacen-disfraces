FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies like tailwind and typescript)
RUN npm ci --include=dev

# Copy application source code
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Set production environment for runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose web port
EXPOSE 3000

# Start server
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
