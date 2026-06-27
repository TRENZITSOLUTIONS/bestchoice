FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS run

WORKDIR /app

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.ts ./
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/next-env.d.ts ./

EXPOSE 3000

CMD ["npm", "start"]
