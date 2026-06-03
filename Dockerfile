# Step 1: Build the React application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app for production
RUN npm run build

# Step 2: Serve the application
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install 'serve' to run the application
RUN npm install -g serve

# Copy the build output from the builder stage
COPY --from=builder /app/dist ./dist

# Render typically provides a PORT environment variable.
# We default to 3000 if it's not set.
ENV PORT=3000
EXPOSE $PORT

# Start the application using 'serve' with single-page application (-s) routing support
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT}"]
