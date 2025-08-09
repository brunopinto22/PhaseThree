# Frontend Dockerfile

# Build stage
FROM node:23 AS build
WORKDIR /frontend

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy default.conf for later use
COPY default.conf /default.conf

# Build the React app
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy the built React app to Nginx's default HTML location
COPY --from=build /frontend/build /usr/share/nginx/html

# Copy the Nginx configuration to the final image
COPY --from=build /default.conf /etc/nginx/conf.d/default.conf

# Start the web server
CMD ["nginx", "-g", "daemon off;"]
