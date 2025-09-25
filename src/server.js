import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import dotenv from 'dotenv'

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { testConnection } from './config/supabase.js'

// Importar rotas
import digimonRoutes from './routes/digimons.js'
import healthRoutes from './routes/health.js'

// Carregar variáveis de ambiente
dotenv.config()

/**
 * Configuração do servidor Fastify
 */
const fastify = Fastify({
})

/**
 * Registrar plugins
 */
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
  })

  // Helmet para segurança
  await fastify.register(helmet, {
    contentSecurityPolicy: false // Desabilitar para Swagger UI
  })

  // Rate limiting
  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minuto
    errorResponseBuilder: (request, context) => {
      return {
        error: true,
        message: 'Muitas requisições. Tente novamente em alguns instantes.',
        statusCode: 429,
        retryAfter: Math.round(context.ttl / 1000)
      }
    }
  })

  // Swagger para documentação
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Digimon Evolution API',
        description: 'API RESTful para consulta de dados de Digimons, evoluções e requisitos',
        version: '1.0.0',
        contact: {
          name: 'Digimon Evolution Team',
          email: 'contact@digimon-evolution.com'
        }
      },
      host: process.env.HOST || 'localhost:3001',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Health', description: 'Endpoints de health check' },
        { name: 'Digimons', description: 'Operações com Digimons' },
        { name: 'Evoluções', description: 'Operações com evoluções' }
      ]
    }
  })

  // Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject
    },
    transformSpecificationClone: true
  })
}

/**
 * Registrar rotas
 */
async function registerRoutes() {
  // Rota raiz
  fastify.get('/', async (request, reply) => {
    return {
      message: 'Digimon Evolution API',
      version: '1.0.0',
      documentation: '/docs',
      health: '/health',
      endpoints: {
        digimons: '/api/digimons',
        search: '/api/digimons/search',
        stats: '/api/digimons/stats'
      }
    }
  })

  // Registrar rotas com prefixos
  await fastify.register(healthRoutes, { prefix: '/health' })
  await fastify.register(digimonRoutes, { prefix: '/api/digimons' })
}

/**
 * Configurar handlers de erro
 */
function setupErrorHandlers() {
  fastify.setErrorHandler(errorHandler)
  fastify.setNotFoundHandler(notFoundHandler)
}

/**
 * Hook para verificar conexão na inicialização
 */
fastify.addHook('onReady', async () => {
  const connection = await testConnection()
  if (!connection.success) {
    fastify.log.error('Falha na conexão com Supabase:', connection.message)
    throw new Error('Não foi possível conectar ao banco de dados')
  }
  fastify.log.info('Conexão com Supabase estabelecida com sucesso')
})

/**
 * Hook para log de requisições
 */
fastify.addHook('onRequest', async (request, reply) => {
  request.log.info({
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip
  }, 'Requisição recebida')
})

/**
 * Hook para log de respostas
 */
fastify.addHook('onSend', async (request, reply, payload) => {
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: reply.getResponseTime()
  }, 'Resposta enviada')
})

/**
 * Inicializar servidor
 */
async function start() {
  try {
    // Registrar plugins
    await registerPlugins()
    
    // Configurar handlers de erro
    setupErrorHandlers()
    
    // Registrar rotas
    await registerRoutes()
    
    // Configurações do servidor
    const host = process.env.HOST || '0.0.0.0'
    const port = parseInt(process.env.PORT) || 3001
    
    // Iniciar servidor
    await fastify.listen({ host, port })
    
    fastify.log.info(`🚀 Servidor rodando em http://${host}:${port}`)
    fastify.log.info(`📚 Documentação disponível em http://${host}:${port}/docs`)
    
  } catch (error) {
    fastify.log.error('Erro ao iniciar servidor:', error)
    process.exit(1)
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  fastify.log.info('Recebido SIGINT, encerrando servidor...')
  try {
    await fastify.close()
    fastify.log.info('Servidor encerrado com sucesso')
    process.exit(0)
  } catch (error) {
    fastify.log.error('Erro ao encerrar servidor:', error)
    process.exit(1)
  }
})

process.on('SIGTERM', async () => {
  fastify.log.info('Recebido SIGTERM, encerrando servidor...')
  try {
    await fastify.close()
    fastify.log.info('Servidor encerrado com sucesso')
    process.exit(0)
  } catch (error) {
    fastify.log.error('Erro ao encerrar servidor:', error)
    process.exit(1)
  }
})

// Iniciar servidor
start()
