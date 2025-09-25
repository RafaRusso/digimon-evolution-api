# Dockerfile para Digimon Evolution API
FROM node:lts-alpine AS base


# Instalar dependências do sistema
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Stage para dependências
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Stage para desenvolvimento
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3001
USER nodejs
CMD ["npm", "run", "dev"]

# Stage para build de produção
FROM base AS build
RUN npm ci
COPY . .
RUN npm run lint || true
USER nodejs

# Stage final de produção
FROM base AS production

# Copiar dependências de produção
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --chown=nodejs:nodejs ./src ./src
COPY --chown=nodejs:nodejs ./package*.json ./

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Expor porta
EXPOSE 3001

# Mudar para usuário não-root
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicialização
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
