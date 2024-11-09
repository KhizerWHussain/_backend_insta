# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN yarn

# Copy the rest of the application files
COPY . .

# Expose the port on which NestJS app will run
EXPOSE 3000

# Start the NestJS application
CMD ["npm", "run", "start:dev"]
