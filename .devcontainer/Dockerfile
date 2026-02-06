FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x (if the apt version is too old, we might need a setup script, 
# but for now let's try standard repositories or use nvm. 
# actually, let's use the official node setup for better version control)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install Netlify CLI globally
RUN npm install -g netlify-cli

# Set working directory
WORKDIR /workspace

# Install Python dependencies
COPY requirements.txt /workspace/
RUN pip install -r requirements.txt


# Keep the container running
CMD ["sleep", "infinity"]
