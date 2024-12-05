# Adjust NODE_VERSION as desired
ARG NODE_VERSION=18.18.0
FROM node:${NODE_VERSION}-slim AS build

# Increase the memory limit for Node.js
ENV NODE_OPTIONS="--max-old-space-size=32768"

# Update package lists and install necessary dependencies, including git
RUN apt-get update && apt-get install -y git build-essential python3 && rm -rf /var/lib/apt/lists/*

LABEL fly_launch_runtime="Svelte.js"

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn

COPY . .

RUN yarn build

# New stage for serving static files
FROM nginx:alpine AS production

# Copy built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# Command to run Nginx
CMD ["nginx", "-g", "daemon off;"]
