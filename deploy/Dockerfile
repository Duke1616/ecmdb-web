FROM node:22.18.0-bookworm AS build
WORKDIR /app
ARG NPM_REGISTRY=https://registry.npmjs.org/
COPY . .
RUN npm install -g pnpm@10 \
    && pnpm config set registry ${NPM_REGISTRY} \
    && pnpm install && pnpm run build
FROM peytonyip/nginx-brotli:1.29.2 AS deploy
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]




