FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL
ARG VITE_S3_DOMAIN
ARG VITE_S3_FOLDER
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_S3_DOMAIN=$VITE_S3_DOMAIN
ENV VITE_S3_FOLDER=$VITE_S3_FOLDER
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

RUN npm run build

FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
