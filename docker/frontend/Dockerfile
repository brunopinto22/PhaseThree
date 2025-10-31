FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .

# Set default API URL for build time (can be overridden via build args)
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
# nginx.conf will be mounted by compose
EXPOSE 80


