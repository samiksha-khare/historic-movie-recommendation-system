# 1. Pick an official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app


# Install system dependencies for Python
# install e.g. build tools if you need them
RUN apk add --no-cache \
      python3 \
      make \
      g++ 
USER root
RUN apt-get update && apt-get install -y python3 python3-pip

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt
RUN pip3 install nltk
RUN python -m nltk.downloader wordnet omw-1.4

COPY package.json package-lock.json* ./
RUN npm install --production

# Copy Node.js app
COPY . .

# RUN python createTopic.py  # Create Kafka topic

# Copy package.json and package-lock.json first (for better caching)
#COPY package*.json ./

# Install Node.js dependencies
#RUN npm install

# Expose Node.js app port
EXPOSE 3000

# Start Node.js app
CMD ["npm", "run", "install"]
