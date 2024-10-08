# https://www.tomray.dev/nestjs-docker-production
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .
COPY .env.production .env

# Creates a "dist" folder with the production build
RUN npm run build

# ENV NODE_ENV production

# Start the server using the production build
CMD [ "node", "dist/main.js" ]
