// src/routes/digimons.js

import { DigimonService } from '../services/digimonService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { schemas, sanitizeSearchTerm, validatePagination } from '../utils/validation.js';
import { 
  successResponse, 
  paginatedResponse, 
  errorResponse 
} from '../utils/response.js';

// Instancia o serviço que vai interagir com o banco de dados
const digimonService = new DigimonService();

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
      // Usando o schema de resposta que definimos em outro lugar
      response: { 200: { $ref: 'listDigimonsResponse#' } }
    }
  }, asyncHandler(async (request, reply) => {
    const { page, limit } = validatePagination(request.query.page, request.query.limit);
    const stage = request.query.stage; // Pega o filtro de stage da query
    
    const result = await digimonService.getAllDigimons({ page, limit, stage });
    
    // O serviço agora deve retornar os dados já formatados e com a paginação
    reply.send(paginatedResponse(result.data, result.pagination));
  }));

  // GET /api/digimons/search - Busca Digimons por nome
  fastify.get('/search', {
    schema: {
      description: 'Busca Digimons por termo de pesquisa',
      tags: ['Digimons'],
      querystring: schemas.searchDigimons.querystring,
      // A resposta é um array de Digimons
      response: { 200: { type: 'array', items: { $ref: 'digimon#' } } }
    }
  }, asyncHandler(async (request, reply) => {
    const searchTerm = sanitizeSearchTerm(request.query.q);
    const limit = Math.min(50, Math.max(1, parseInt(request.query.limit) || 10));
    
    if (!searchTerm) {
      return reply.status(400).send(errorResponse('Termo de busca é obrigatório'));
    }
    
    const results = await digimonService.searchDigimons({ searchTerm, limit });
    
    reply.send(successResponse(results, `${results.length} Digimons encontrados`));
  }));

  // GET /api/digimons/stats - Estatísticas gerais
  fastify.get('/stats', {
    schema: {
      description: 'Obtém estatísticas gerais dos Digimons (total, por stage, etc.)',
      tags: ['Digimons'],
      response: { 200: { type: 'object' } } // Resposta genérica para estatísticas
    }
  }, asyncHandler(async (request, reply) => {
    const stats = await digimonService.getStats();
    reply.send(successResponse(stats, 'Estatísticas recuperadas com sucesso'));
  }));

  // GET /api/digimons/:id - Busca Digimon por ID
  fastify.get('/:id', {
    schema: {
      description: 'Busca um Digimon específico pelo seu ID numérico',
      tags: ['Digimons'],
      params: schemas.digimonId.params, // Usa o schema de ID numérico
      response: { 200: { $ref: 'digimon#' } } // A resposta é um único objeto Digimon
    }
  }, asyncHandler(async (request, reply) => {
    const digimon = await digimonService.getDigimonById(request.params.id);
    
    if (!digimon) {
      return reply.status(404).send(errorResponse('Digimon não encontrado', 404));
    }
    
    reply.send(successResponse(digimon, 'Digimon encontrado'));
  }));

  // GET /api/digimons/:id/evolutions - Evoluções e requisitos de um Digimon
  fastify.get('/:id/evolutions', {
    schema: {
      description: 'Obtém as pré-evoluções, próximas evoluções e requisitos de um Digimon',
      tags: ['Evoluções'],
      params: schemas.digimonId.params
      // O schema de resposta aqui é complexo, pode ser definido depois
    }
  }, asyncHandler(async (request, reply) => {
    const evolutionData = await digimonService.getEvolutionData(request.params.id);
    
    if (!evolutionData.digimon) {
      return reply.status(404).send(errorResponse('Digimon não encontrado', 404));
    }
    
    reply.send(successResponse(evolutionData, 'Dados de evolução recuperados'));
  }));

  // GET /api/digimons/name/:name - Busca Digimon por nome exato
  fastify.get('/name/:name', {
    schema: {
      description: 'Busca um Digimon pelo seu nome exato (URL-encoded)',
      tags: ['Digimons'],
      params: schemas.digimonName.params,
      response: { 200: { $ref: 'digimon#' } }
    }
  }, asyncHandler(async (request, reply) => {
    // O nome pode vir com espaços, etc. O Fastify já decodifica o URI component.
    const digimon = await digimonService.getDigimonByName(request.params.name);
    
    if (!digimon) {
      return reply.status(404).send(errorResponse('Digimon não encontrado', 404));
    }
    
    reply.send(successResponse(digimon, 'Digimon encontrado'));
  }));
}
