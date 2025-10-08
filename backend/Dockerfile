# --- Stage 1: Build ---
# Use an official Node.js runtime as a parent image. 'alpine' is a lightweight version.
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# By copying these first, Docker can cache the installed dependencies
# unless these files change, which speeds up subsequent builds.
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your application's source code from your local machine to the container
COPY . .

# Your app runs on port 5001, so we need to expose it
EXPOSE 5001

# --- Stage 2: Run ---
# Define the command to run your app
CMD ["npm", "start"]
