import { supabase } from '../config/supabase.js'

export class DigimonService {
  
  /**
   * Busca todos os Digimons com paginação
   */
  async getAllDigimons(page = 1, limit = 50, stage = null) {
    try {
      let query = supabase
        .from('digimons')
        .select('*')
        .order('number', { ascending: true })
      
      // Filtrar por stage se especificado
      if (stage) {
        query = query.eq('stage', stage)
      }
      
      // Aplicar paginação
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
      
      const { data, error, count } = await query
      
      if (error) {
        throw error
      }
      
      return {
        data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      throw new Error(`Erro ao buscar Digimons: ${error.message}`)
    }
  }
  
  /**
   * Busca Digimon por ID
   */
  async getDigimonById(id) {
    try {
      const { data, error } = await supabase
        .from('digimons')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null // Não encontrado
        }
        throw error
      }
      
      return data
    } catch (error) {
      throw new Error(`Erro ao buscar Digimon: ${error.message}`)
    }
  }
  
  /**
   * Busca Digimon por nome
   */
  async getDigimonByName(name) {
    try {
      const { data, error } = await supabase
        .from('digimons')
        .select('*')
        .eq('name', name)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null // Não encontrado
        }
        throw error
      }
      
      return data
    } catch (error) {
      throw new Error(`Erro ao buscar Digimon: ${error.message}`)
    }
  }
  
  /**
   * Busca Digimons por termo de pesquisa
   */
  async searchDigimons(searchTerm, limit = 10) {
    try {
      const { data, error } = await supabase
        .rpc('search_digimons', { search_term: searchTerm })
        .limit(limit)
      
      if (error) {
        throw error
      }
      
      return data
    } catch (error) {
      throw new Error(`Erro na busca: ${error.message}`)
    }
  }
  
  /**
   * Obtém evoluções diretas de um Digimon
   */
  async getDigimonEvolutions(digimonId) {
    try {
      const { data, error } = await supabase
        .from('evolutions')
        .select(`
          to_digimon_id,
          to_digimon:digimons!evolutions_to_digimon_id_fkey (
            id,
            number,
            name,
            stage,
            attribute,
            image_filename
          )
        `)
        .eq('from_digimon_id', digimonId)
      
      if (error) {
        throw error
      }
      
      return data.map(item => item.to_digimon)
    } catch (error) {
      throw new Error(`Erro ao buscar evoluções: ${error.message}`)
    }
  }
  
  /**
   * Obtém pré-evoluções diretas de um Digimon
   */
  async getDigimonPreEvolutions(digimonId) {
    try {
      const { data, error } = await supabase
        .from('evolutions')
        .select(`
          from_digimon_id,
          from_digimon:digimons!evolutions_from_digimon_id_fkey (
            id,
            number,
            name,
            stage,
            attribute,
            image_filename
          )
        `)
        .eq('to_digimon_id', digimonId)
      
      if (error) {
        throw error
      }
      
      return data.map(item => item.from_digimon)
    } catch (error) {
      throw new Error(`Erro ao buscar pré-evoluções: ${error.message}`)
    }
  }
  
  /**
   * Obtém requisitos de evolução de um Digimon
   */
  async getDigimonRequirements(digimonId) {
    try {
      const { data, error } = await supabase
        .from('evolution_requirements')
        .select('*')
        .eq('digimon_id', digimonId)
        .order('requirement_type', { ascending: true })
        .order('name', { ascending: true })
      
      if (error) {
        throw error
      }
      
      // Agrupar por tipo de requisito
      const grouped = {
        stats: [],
        other: []
      }
      
      data.forEach(req => {
        if (req.requirement_type === 'stats') {
          grouped.stats.push({
            name: req.name,
            value: req.value,
            description: req.description
          })
        } else {
          grouped.other.push({
            name: req.name,
            value: req.value,
            description: req.description
          })
        }
      })
      
      return grouped
    } catch (error) {
      throw new Error(`Erro ao buscar requisitos: ${error.message}`)
    }
  }
  
  /**
   * Obtém linha evolutiva completa usando função SQL
   */
  async getEvolutionLine(digimonName) {
    try {
      const { data, error } = await supabase
        .rpc('get_evolution_line', { digimon_name: digimonName })
      
      if (error) {
        throw error
      }
      
      // Agrupar por tipo de evolução
      const result = {
        current: null,
        predecessors: [],
        successors: []
      }
      
      data.forEach(item => {
        const digimon = {
          id: item.digimon_id,
          number: item.digimon_number,
          name: item.digimon_name,
          stage: item.digimon_stage,
          attribute: item.digimon_attribute,
          image_filename: item.digimon_image
        }
        
        switch (item.evolution_type) {
          case 'current':
            result.current = digimon
            break
          case 'predecessor':
            result.predecessors.push(digimon)
            break
          case 'successor':
            result.successors.push(digimon)
            break
        }
      })
      
      return result
    } catch (error) {
      throw new Error(`Erro ao buscar linha evolutiva: ${error.message}`)
    }
  }
  
  /**
   * Obtém estatísticas gerais
   */
  async getStats() {
    try {
      // Contar total de Digimons
      const { count: totalDigimons, error: countError } = await supabase
        .from('digimons')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        throw countError
      }
      
      // Contar por stage
      const { data: stageStats, error: stageError } = await supabase
        .from('digimons')
        .select('stage')
        .then(({ data, error }) => {
          if (error) throw error
          
          const counts = {}
          data.forEach(item => {
            counts[item.stage] = (counts[item.stage] || 0) + 1
          })
          
          return { data: counts, error: null }
        })
      
      if (stageError) {
        throw stageError
      }
      
      // Contar por atributo
      const { data: attributeStats, error: attributeError } = await supabase
        .from('digimons')
        .select('attribute')
        .then(({ data, error }) => {
          if (error) throw error
          
          const counts = {}
          data.forEach(item => {
            counts[item.attribute] = (counts[item.attribute] || 0) + 1
          })
          
          return { data: counts, error: null }
        })
      
      if (attributeError) {
        throw attributeError
      }
      
      return {
        total_digimons: totalDigimons,
        by_stage: stageStats,
        by_attribute: attributeStats
      }
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`)
    }
  }
}
