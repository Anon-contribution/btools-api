#!/bin/bash

# 1️⃣ Démarrer Ollama en arrière-plan
ollama serve &

# 2️⃣ Lancer ton backend Node (qui exécutera mcphost)
node index.js