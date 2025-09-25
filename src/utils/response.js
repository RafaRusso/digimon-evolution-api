/**
 * Utilitários para formatação de respostas da API
 */

/**
 * Formata resposta de sucesso
 */
export function successResponse(data, message = 'Sucesso', meta = null) {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }

  if (meta) {
    response.meta = meta
  }

  return response
}

/**
 * Formata resposta de erro
 */
export function errorResponse(message, statusCode = 500, details = null) {
  const response = {
    success: false,
    error: true,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  }

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details
  }

  return response
}

/**
 * Formata resposta paginada
 */
export function paginatedResponse(data, pagination, message = 'Dados recuperados com sucesso') {
  return successResponse(data, message, {
    pagination: {
      currentPage: pagination.page,
      itemsPerPage: pagination.limit,
      totalItems: pagination.total,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPreviousPage: pagination.page > 1
    }
  })
}

/**
 * Formata dados do Digimon para resposta
 */
export function formatDigimonData(digimon, includeEvolutions = false, evolutions = null, requirements = null) {
  const formatted = {
    id: digimon.id,
    number: digimon.number,
    name: digimon.name,
    stage: digimon.stage,
    attribute: digimon.attribute,
    imageUrl: digimon.image_filename ? `/images/${digimon.image_filename}` : null
  }

  if (includeEvolutions && evolutions) {
    formatted.evolutions = {
      evolves_to: evolutions.evolves_to || [],
      evolves_from: evolutions.evolves_from || []
    }
  }

  if (requirements) {
    formatted.requirements = requirements
  }

  return formatted
}

/**
 * Formata linha evolutiva completa
 */
export function formatEvolutionLine(evolutionLine) {
  if (!evolutionLine.current) {
    return null
  }

  return {
    current: formatDigimonData(evolutionLine.current),
    predecessors: evolutionLine.predecessors.map(d => formatDigimonData(d)),
    successors: evolutionLine.successors.map(d => formatDigimonData(d)),
    totalPredecessors: evolutionLine.predecessors.length,
    totalSuccessors: evolutionLine.successors.length
  }
}

/**
 * Formata estatísticas
 */
export function formatStats(stats) {
  return {
    summary: {
      totalDigimons: stats.total_digimons,
      totalStages: Object.keys(stats.by_stage).length,
      totalAttributes: Object.keys(stats.by_attribute).length
    },
    distribution: {
      byStage: stats.by_stage,
      byAttribute: stats.by_attribute
    }
  }
}
