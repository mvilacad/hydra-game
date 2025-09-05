# Use Node.js 22 LTS as base image
FROM node:22-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build stage
FROM base AS builder
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy package files for production dependencies
COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 5000
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["pnpm", "start"]