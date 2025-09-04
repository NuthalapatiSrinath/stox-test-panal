# Use Node.js 18 (works with bcrypt and socket.io)
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy rest of the code
COPY . .

# Environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port for Vercel/Docker
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
