FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 5000

# Start server (Prisma migrations will be handled via docker-compose command)
CMD ["npm", "start"]
