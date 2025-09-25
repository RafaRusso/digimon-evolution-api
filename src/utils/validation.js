// src/utils/validation.js

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
          description: 'Termo de busca para o nome do Digimon'
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
          // Adicionamos todos os stages possíveis do seu JSON para uma validação robusta
          enum: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VI+', 'Armor', 'Human Hybrid', 'Beast Hybrid', 'Fusion Hybrid', 'Golden Armor', 'Transcendent Hybrid', 'Unknown', 'N/A'],
          description: 'Filtrar por estágio de evolução'
        }
      }
    }
  },

  // Schema para parâmetros de ID (AJUSTADO)
  digimonId: {
    params: {
      type: 'object',
      properties: {
        // MUDANÇA: Agora esperamos um número inteiro (integer) em vez de um UUID.
        id: { 
          type: 'integer',
          minimum: 1,
          description: 'O ID numérico do Digimon'
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
          description: 'Nome exato do Digimon (case-sensitive)'
        }
      },
      required: ['name']
    }
  }
};

// As funções utilitárias permanecem as mesmas, pois são genéricas e úteis.

/**
 * Sanitiza termo de busca para evitar injeções simples.
 */
export function sanitizeSearchTerm(term) {
  if (!term || typeof term !== 'string') {
    return '';
  }
  
  return term
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres que podem ser usados em ataques XSS
    .substring(0, 100); // Limita o tamanho para performance
}

/**
 * Valida e normaliza parâmetros de paginação.
 */
export function validatePagination(page, limit) {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));
  
  return {
    page: validatedPage,
    limit: validatedLimit
  };
}
