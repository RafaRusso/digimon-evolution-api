import { DigimonService } from '../services/digimonService.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { schemas, sanitizeSearchTerm, validatePagination } from '../utils/validation.js'
import { 
  successResponse, 
  paginatedResponse, 
  formatDigimonData, 
  formatEvolutionLine,
  errorResponse 
} from '../utils/response.js'

const digimonService = new DigimonService()

/**
 * Rotas para operações com Digimons
 */
export default async function digimonRoutes(fastify, options) {
  
  // GET /api/digimons - Lista todos os Digimons com paginação
  fastify.get('/', {
    schema: {
      description: 'Lista todos os Digimons com paginação e filtros',
      tags: ['Digimons'],
      querystring: schemas.listDigimons.querystring,
    }
  }, asyncHandler(async (request, reply) => {
    const { page, limit, stage } = validatePagination(
      request.query.page, 
      request.query.limit
    )
    
    const result = await digimonService.getAllDigimons(page, limit, request.query.stage)
    
    const formattedData = result.data.map(digimon => formatDigimonData(digimon))
    
    reply.send(paginatedResponse(formattedData, result.pagination))
  }))

  // GET /api/digimons/search - Busca Digimons por nome
  fastify.get('/search', {
    schema: {
      description: 'Busca Digimons por termo de pesquisa',
      tags: ['Digimons'],
      querystring: schemas.searchDigimons.querystring,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  number: { type: 'integer' },
                  name: { type: 'string' },
                  stage: { type: 'string' },
                  attribute: { type: 'string' },
                  image_url: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, asyncHandler(async (request, reply) => {
    const searchTerm = sanitizeSearchTerm(request.query.q)
    const limit = Math.min(50, Math.max(1, parseInt(request.query.limit) || 10))
    
    if (!searchTerm) {
      return reply.status(400).send(errorResponse('Termo de busca é obrigatório'))
    }
    
    const results = await digimonService.searchDigimons(searchTerm, limit)
    const formattedData = results.map(digimon => formatDigimonData(digimon))
    
    reply.send(successResponse(formattedData, `${results.length} Digimons encontrados`))
  }))

  // GET /api/digimons/stats - Estatísticas gerais
  fastify.get('/stats', {
    schema: {
      description: 'Obtém estatísticas gerais dos Digimons',
      tags: ['Digimons'],
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
    const stats = await digimonService.getStats()
    reply.send(successResponse(stats, 'Estatísticas recuperadas com sucesso'))
  }))

  // GET /api/digimons/:id - Busca Digimon por ID
  fastify.get('/:id', {
    schema: {
      description: 'Busca Digimon por ID',
      tags: ['Digimons'],
      params: schemas.digimonId.params,
    }
  }, asyncHandler(async (request, reply) => {
    const digimon = await digimonService.getDigimonById(request.params.id)
    
    if (!digimon) {
      return reply.status(404).send(errorResponse('Digimon não encontrado', 404))
    }
    
    const formattedData = formatDigimonData(digimon)
    reply.send(successResponse(formattedData, 'Digimon encontrado'))
  }))

  // GET /api/digimons/:id/evolutions - evoluções
  fastify.get('/:id/evolutions', {     
    schema: {
      description: 'Obtém as evoluções diretas de um Digimon',
      tags: ['Evoluções'],
      params: schemas.digimonId.params
    }
  }, asyncHandler(async (request, reply) => {
    const digimonId = request.params.id;

    const digimon = await digimonService.getDigimonById(digimonId);
    if (!digimon) {
      return reply.status(404).send(errorResponse('Digimon não encontrado', 404));
    }
    
    // As duas buscas principais agora são feitas em paralelo
    const [evolutions, preEvolutions] = await Promise.all([
      // Esta chamada agora retorna as evoluções JÁ COM os requisitos!
      digimonService.getDigimonEvolutions(digimonId),
      digimonService.getDigimonPreEvolutions(digimonId)
    ]);
    
    // Monta a resposta final
    const evolutionData = {
      digimon: formatDigimonData(digimon),
      // Não precisa mais de um map complexo, os dados já vêm prontos
      evolves_to: evolutions.map(d => formatDigimonData(d)),
      evolves_from: preEvolutions.map(d => formatDigimonData(d))
    };
    
    reply.send(successResponse(evolutionData, 'Dados de evolução recuperados'));
  }));

  // GET /api/digimons/:id/evolution-line - Linha evolutiva completa
  fastify.get('/:id/evolution-line', {
    schema: {
      description: 'Obtém linha evolutiva completa de um Digimon',
      tags: ['Evoluções'],
      params: schemas.digimonId.params
    }
  }, asyncHandler(async (request, reply) => {
    const digimon = await digimonService.getDigimonById(request.params.id)
    
    if (!digimon) {
      return reply.status(404).send(errorResponse('Digimon não encontrado', 404))
    }
    
      const evolutionLine = await digimonService.getEvolutionLine(digimon.name);
      
      if (!evolutionLine) {
        return reply.status(404).send(errorResponse('Digimon não encontrado', 404));
      }

      reply.send(successResponse(evolutionLine, 'Árvore evolutiva recuperada'));
  }))

  // GET /api/digimons/name/:name - Busca Digimon por nome exato
  fastify.get('/name/:name', {
    schema: {
      description: 'Busca Digimon por nome exato',
      tags: ['Digimons'],
      params: schemas.digimonName.params
    }
  }, asyncHandler(async (request, reply) => {
    const digimon = await digimonService.getDigimonByName(request.params.name)
    
    if (!digimon) {
      return reply.status(404).send(errorResponse('Digimon não encontrado', 404))
    }
    
    const formattedData = formatDigimonData(digimon)
    reply.send(successResponse(formattedData, 'Digimon encontrado'))
  }))

  // GET /api/digimons/name/:name/evolution-line - Linha evolutiva por nome
    fastify.get('/name/:name/evolution-line', {     
      schema: {
        description: 'Obtém linha evolutiva completa de um Digimon',
        tags: ['Evoluções'],
        params: schemas.digimonName.params
      }  
    }, asyncHandler(async (request, reply) => {
      const evolutionLine = await digimonService.getEvolutionLine(request.params.name);
      
      if (!evolutionLine) {
        return reply.status(404).send(errorResponse('Digimon não encontrado', 404));
      }
      const formattedData = formatEvolutionLine(evolutionLine);
      reply.send(successResponse(evolutionLine, 'Árvore evolutiva recuperada'));
    }));

}
