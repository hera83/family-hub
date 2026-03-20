# ── Stage 1: Build ──
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json bun.lock* package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .

# Build args become VITE_ env vars at build time
ARG VITE_FAMILYHUB_API_BASE_URL
ARG VITE_FAMILYHUB_API_KEY

RUN npm run build

# ── Stage 2: Serve ──
FROM nginx:1.27-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config with SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
