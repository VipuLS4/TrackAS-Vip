FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs and uploads directories
RUN mkdir -p logs uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S trackas -u 1001

# Change ownership of the app directory
RUN chown -R trackas:nodejs /app
USER trackas

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "index.js"]
