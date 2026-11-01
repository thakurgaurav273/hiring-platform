FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code and prisma schema
COPY src ./src

# Generate prisma client
RUN npm run prisma:generate

# Build the application
RUN npm run build

# ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy prisma schema
COPY src/database/prisma ./src/database/prisma

# Generate prisma client for production
RUN npm run prisma:generate

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["npm", "run", "start:prod"]
