import { testConnection } from '../config/supabase.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { asyncHandler } from '../middleware/errorHandler.js'

/**
 * Rotas para health check e status da API
 */
export default async function healthRoutes(fastify, options) {
  
  // GET /health - Health check básico
  fastify.get('/', {
    schema: {
      description: 'Health check básico da API',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                timestamp: { type: 'string' },
                uptime: { type: 'number' },
                version: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
    
    reply.send(successResponse(healthData, 'API está funcionando'))
  })

  // GET /health/detailed - Health check detalhado
  fastify.get('/detailed', {
    schema: {
      description: 'Health check detalhado incluindo conexão com banco',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, asyncHandler(async (request, reply) => {
    const startTime = Date.now()
    
    // Testar conexão com Supabase
    const dbConnection = await testConnection()
    
    const healthData = {
      status: dbConnection.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime,
      services: {
        database: {
          status: dbConnection.success ? 'connected' : 'disconnected',
          message: dbConnection.message
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      }
    }
    
    const statusCode = dbConnection.success ? 200 : 503
    const message = dbConnection.success ? 'Todos os serviços estão funcionando' : 'Alguns serviços estão indisponíveis'
    
    reply.status(statusCode).send(successResponse(healthData, message))
  }))

  // GET /health/ready - Readiness probe
  fastify.get('/ready', {
    schema: {
      description: 'Verifica se a API está pronta para receber requisições',
      tags: ['Health']
    }
  }, asyncHandler(async (request, reply) => {
    const dbConnection = await testConnection()
    
    if (dbConnection.success) {
      reply.send(successResponse({ ready: true }, 'API pronta'))
    } else {
      reply.status(503).send(errorResponse('API não está pronta', 503, {
        database: dbConnection.message
      }))
    }
  }))

  // GET /health/live - Liveness probe
  fastify.get('/live', {
    schema: {
      description: 'Verifica se a API está viva',
      tags: ['Health']
    }
  }, async (request, reply) => {
    reply.send(successResponse({ alive: true }, 'API está viva'))
  })
}
