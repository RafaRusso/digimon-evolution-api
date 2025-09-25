/**
 * Schemas de validação para os endpoints
 */

export const schemas = {
  // Schema para busca de Digimons
  searchDigimons: {
    querystring: {
      type: 'object',
      properties: {
        q: { 
          type: 'string', 
          minLength: 1,
          maxLength: 100,
          description: 'Termo de busca'
        },
        limit: { 
          type: 'integer', 
          minimum: 1, 
          maximum: 50,
          default: 10,
          description: 'Limite de resultados'
        }
      },
      required: ['q']
    }
  },

  // Schema para listagem de Digimons
  listDigimons: {
    querystring: {
      type: 'object',
      properties: {
        page: { 
          type: 'integer', 
          minimum: 1,
          default: 1,
          description: 'Número da página'
        },
        limit: { 
          type: 'integer', 
          minimum: 1, 
          maximum: 100,
          default: 50,
          description: 'Itens por página'
        },
        stage: { 
          type: 'string',
          enum: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VI+', 'Human Hybrid', 'Beast Hybrid'],
          description: 'Filtrar por stage'
        }
      }
    }
  },

  // Schema para parâmetros de ID
  digimonId: {
    params: {
      type: 'object',
      properties: {
        id: { 
          type: 'string',
          format: 'uuid',
          description: 'ID do Digimon'
        }
      },
      required: ['id']
    }
  },

  // Schema para parâmetros de nome
  digimonName: {
    params: {
      type: 'object',
      properties: {
        name: { 
          type: 'string',
          minLength: 1,
          maxLength: 255,
          description: 'Nome do Digimon'
        }
      },
      required: ['name']
    }
  }
}

/**
 * Valida se um UUID é válido
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Sanitiza termo de busca
 */
export function sanitizeSearchTerm(term) {
  if (!term || typeof term !== 'string') {
    return ''
  }
  
  return term
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres perigosos
    .substring(0, 100) // Limita tamanho
}

/**
 * Valida parâmetros de paginação
 */
export function validatePagination(page, limit) {
  const validatedPage = Math.max(1, parseInt(page) || 1)
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 50))
  
  return {
    page: validatedPage,
    limit: validatedLimit
  }
}
