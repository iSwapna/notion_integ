
FROM node:18-alpine
WORKDIR /app

# Install Yarn
RUN apk add --no-cache yarn

COPY package.json yarn.lock ./

RUN yarn install 

COPY . .

CMD ["yarn", "dev"]
EXPOSE 3000
