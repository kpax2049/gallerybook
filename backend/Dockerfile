# Use an official Node runtime as a parent image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the container at /usr/src/app
COPY ["package*.json", "./"]

# Install any needed packages specified in package.json
RUN npm install

# Bundle app source inside Docker image
COPY . .

# Make port 4000 available to the world outside this container
EXPOSE 4000

# Run app.js when the container launches
CMD ["npm", "run", "start:dev"]
