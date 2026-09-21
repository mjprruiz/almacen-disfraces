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
ENV HOSTNAME=0.0.0.0

# Start server dynamically respecting $PORT (Render provides PORT=10000, local defaults to 3000)
CMD ["sh", "-c", "npx next start -p ${PORT:-3000} -H 0.0.0.0"]
