/**
 * Middleware para tratamento global de erros
 */
export function errorHandler(error, request, reply) {
  const { log } = request

  // Log do erro
  log.error(error)

  // Determinar status code baseado no tipo de erro
  let statusCode = 500
  let message = 'Erro interno do servidor'

  if (error.validation) {
    // Erro de validação do Fastify
    statusCode = 400
    message = 'Dados inválidos'
  } else if (error.statusCode) {
    // Erro com status code definido
    statusCode = error.statusCode
    message = error.message
  } else if (error.message.includes('não encontrado')) {
    statusCode = 404
    message = error.message
  } else if (error.message.includes('Erro na busca') || 
             error.message.includes('Erro ao buscar')) {
    statusCode = 400
    message = error.message
  }

  // Resposta de erro padronizada
  const errorResponse = {
    error: true,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  }

  // Em desenvolvimento, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack
  }

  reply.status(statusCode).send(errorResponse)
}

/**
 * Middleware para capturar erros não tratados
 */
export function notFoundHandler(request, reply) {
  reply.status(404).send({
    error: true,
    message: 'Endpoint não encontrado',
    statusCode: 404,
    timestamp: new Date().toISOString()
  })
}

/**
 * Wrapper para handlers assíncronos
 */
export function asyncHandler(fn) {
  return async (request, reply) => {
    try {
      await fn(request, reply)
    } catch (error) {
      reply.send(error)
    }
  }
}
