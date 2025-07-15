# ============================================================
# 🐳 Dockerfile — Solidity MCP Assistant
# Installs: Git, Go, Ollama, mcphost, Node backend
# ============================================================

FROM node:20-bullseye

# -----------------------------------------------
# ✅ Install Go
# -----------------------------------------------
ENV GO_VERSION=1.22.4

RUN wget https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz && \
    rm go${GO_VERSION}.linux-amd64.tar.gz

ENV PATH=$PATH:/usr/local/go/bin

# -----------------------------------------------
# ✅ Install Ollama
# Note: Official installer for Linux
# -----------------------------------------------
RUN curl -fsSL https://ollama.com/install.sh | sh

# -----------------------------------------------
# ✅ Copy your mcphost script template
# -----------------------------------------------
WORKDIR /app

COPY mcphost.sh /app/mcphost.sh

# -----------------------------------------------
# ✅ Copy Node backend dependencies
# -----------------------------------------------
COPY package.json ./
COPY yarn.lock ./

# -----------------------------------------------
# ✅ Install only production dependencies
# -----------------------------------------------
RUN npm install --production

# -----------------------------------------------
# ✅ Install mcphost using Go
# -----------------------------------------------
RUN go install github.com/mark3labs/mcphost@latest

RUN cp /root/go/bin/mcphost /usr/local/bin/

# -----------------------------------------------
# ✅ Copy the rest of the backend source code
# -----------------------------------------------
COPY . .

# -----------------------------------------------
# ✅ Expose the backend HTTP port
# -----------------------------------------------
EXPOSE 3000

# -----------------------------------------------
# ✅ CMD to start your API backend
# Note: Ollama runs via exec when the backend needs it.
# -----------------------------------------------
# CMD ["node", "index.js"]
# Use Entrypoint to run ollama before starting app

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
