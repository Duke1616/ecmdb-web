FROM node:22.18.0-bookworm as build
WORKDIR /app
COPY . .
RUN npm install -g pnpm \
    && pnpm set registry https://registry.npmmirror.com/ \
    && pnpm install && pnpm run build
FROM peytonyip/nginx-brotli:1.29.2 as deploy
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]





