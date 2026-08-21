# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts
COPY . ./
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine
USER root
RUN apk upgrade --no-cache
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/neko-doan/browser /usr/share/nginx/html
USER 101
EXPOSE 8080
