# Use Node.js Alpine as the base image
FROM node:18-alpine

# Install postfix and other dependencies
RUN apk add --no-cache postfix bash

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json, package-lock.json, and tsconfig.json
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the entire src directory
COPY src ./src

# Build the project
RUN npm run build

# Copy the rootfs contents
COPY rootfs /

# Ensure the run script is executable
RUN chmod +x /usr/bin/run.sh

# Create logs directory
RUN mkdir -p logs

# Expose SMTP port
EXPOSE 25

# Set the entrypoint
CMD [ "/usr/bin/run.sh" ]