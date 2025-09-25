# Digimon Evolution API

API RESTful para consulta de dados de Digimons, evoluções e requisitos evolutivos. Desenvolvida com Fastify e Supabase.

## 🚀 Funcionalidades

- **Busca de Digimons** por nome ou ID
- **Listagem paginada** com filtros por stage
- **Evoluções diretas** e linha evolutiva completa
- **Requisitos de evolução** detalhados
- **Estatísticas** gerais da base de dados
- **Documentação interativa** com Swagger
- **Rate limiting** e segurança
- **Health checks** para monitoramento

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Banco de dados configurado (ver `supabase_setup.md`)

## 🛠️ Instalação

1. **Clone e instale dependências:**
```bash
cd digimon-api
npm install
```

2. **Configure variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Configure o banco de dados:**
- Siga as instruções em `../supabase_setup.md`
- Execute o schema SQL no Supabase
- Execute a migração de dados

4. **Inicie o servidor:**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 Documentação da API

Acesse `http://localhost:3001/docs` para ver a documentação interativa Swagger.

### Endpoints Principais

#### Digimons

- `GET /api/digimons` - Lista todos os Digimons
  - Query params: `page`, `limit`, `stage`
  
- `GET /api/digimons/search?q=nome` - Busca por nome
  - Query params: `q` (obrigatório), `limit`
  
- `GET /api/digimons/:id` - Busca por ID
  
- `GET /api/digimons/name/:name` - Busca por nome exato

#### Evoluções

- `GET /api/digimons/:id/evolutions` - Evoluções diretas
  
- `GET /api/digimons/:id/evolution-line` - Linha evolutiva completa
  
- `GET /api/digimons/name/:name/evolution-line` - Linha evolutiva por nome

#### Estatísticas

- `GET /api/digimons/stats` - Estatísticas gerais

#### Health Check

- `GET /health` - Health check básico
- `GET /health/detailed` - Health check detalhado
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Exemplos de Uso

```bash
# Buscar Digimons por nome
curl "http://localhost:3001/api/digimons/search?q=Agumon"

# Obter linha evolutiva
curl "http://localhost:3001/api/digimons/name/Agumon/evolution-line"

# Listar Digimons do Stage III
curl "http://localhost:3001/api/digimons?stage=III&limit=10"

# Estatísticas
curl "http://localhost:3001/api/digimons/stats"
```

### Formato de Resposta

Todas as respostas seguem o padrão:

```json
{
  "success": true,
  "message": "Descrição da operação",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "meta": { ... } // Opcional, para paginação
}
```

### Paginação

Endpoints que retornam listas incluem metadados de paginação:

```json
{
  "meta": {
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 50,
      "totalItems": 1000,
      "totalPages": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Servidor
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Logs
LOG_LEVEL=info
```

### Rate Limiting

Por padrão, a API limita a 100 requisições por minuto por IP. Configure via:
- `RATE_LIMIT_MAX`: Número máximo de requisições
- `RATE_LIMIT_WINDOW`: Janela de tempo em ms

### CORS

Configure as origens permitidas via `CORS_ORIGIN`:
- `true`: Permite todas as origens
- `http://localhost:5173`: Origem específica
- `["http://localhost:3000", "https://app.com"]`: Múltiplas origens

## 🐳 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3001
CMD ["npm", "start"]
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Lint
npm run lint

# Format
npm run format
```

## 📊 Monitoramento

### Health Checks

- `/health/live`: Verifica se o processo está rodando
- `/health/ready`: Verifica se a API pode receber tráfego
- `/health/detailed`: Inclui status do banco e métricas

### Logs

A API usa Pino para logs estruturados. Em desenvolvimento, os logs são formatados para melhor legibilidade.

### Métricas

O endpoint `/health/detailed` inclui:
- Tempo de resposta
- Uso de memória
- Tempo de atividade
- Status dos serviços

## 🚀 Deploy

Ver `../render_deploy.md` para instruções de deploy no Render.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.
