FROM node:20.12.2-alpine3.19 as build
WORKDIR /app
COPY . .
RUN npm install -g pnpm \
    && pnpm set registry https://registry.npmmirror.com/ \
    && pnpm install && pnpm run build
FROM nginx:1.26.0 as deploy
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]





