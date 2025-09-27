import { supabase } from '../config/supabase.js'
function groupRequirements(digimon) {
  if (!digimon || !Array.isArray(digimon.requirements)) {
    // Garante que mesmo digimons sem requisitos tenham a estrutura correta
    if (digimon) digimon.requirements = { stats: [], other: [] };
    return digimon;
  }

  const grouped = {
    stats: [],
    other: []
  };
  
  digimon.requirements.forEach(req => {
    const requirementData = {
      name: req.name,
      value: req.value,
      description: req.description
    };
    if (req.type === 'stat') {
      grouped.stats.push(requirementData);
    } else {
      grouped.other.push(requirementData);
    }
  });

  // Substitui a lista de requisitos pela estrutura agrupada
  digimon.requirements = grouped;
  return digimon;
}
export class DigimonService {
  
  /**
   * Busca todos os Digimons com paginação
   */
  async getAllDigimons(page, limit, stage = null) {
    try {
      let query = supabase
        .from('digimons')
        .select(`*, requirements(*)`, { count: 'exact' }); // <--- GARANTA QUE O COUNT ESTÁ AQUI
  
      if (stage) {
        query = query.eq('stage', stage);
      }
  
      query = query.order('number', { ascending: true });
  
      if (page && limit) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
      }
  
      const { data, error, count } = await query;
  
      if (error) {
        throw error;
      }
      const digimonsWithGroupedRequirements = data.map(digimon => {
        if (!digimon || !digimon.requirements) {
          // Garante que mesmo digimons sem requisitos sejam retornados
          if (digimon) digimon.requirements = { stats: [], other: [] };
          return digimon;
        }

        const grouped = {
          stats: [],
          other: []
        };
        
        digimon.requirements.forEach(req => {
          if (req.type === 'stat') {
            grouped.stats.push({
              name: req.name,
              value: req.value,
              description: req.description
            });
          } else {
            grouped.other.push({
              name: req.name,
              value: req.value,
              description: req.description
            });
          }
        });

        // Substitui a lista de requis  itos pela estrutura agrupada
        digimon.requirements = grouped;
        return digimon;
      });
      return {
        data: digimonsWithGroupedRequirements,
        pagination: {
          page,
          limit,
          total: count, // <--- USE O COUNT AQUI
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar Digimons: ${error.message}`);
    }
  }
  
  /**
   * Busca Digimon por ID
   */
  async getDigimonById(id) {
    try {
      const { data, error } = await supabase
        .from('digimons')
        .select(`*, requirements(*)`)
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null // Não encontrado
        }
        throw error
      }
      if (!data || !data.requirements) {
        // Garante que mesmo digimons sem requisitos sejam retornados
        if (data) data.requirements = { stats: [], other: [] };
        return data;
      }
        const grouped = {
          stats: [],
          other: []
        };        
        data.requirements.forEach(req => {
          if (req.type === 'stat') {
            grouped.stats.push({
              name: req.name,
              value: req.value,
              description: req.description
            });
          } else {
            grouped.other.push({
              name: req.name,
              value: req.value,
              description: req.description
            });
          }
        });
        // Substitui a lista de requis  itos pela estrutura agrupada
        data.requirements = grouped;
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
        .select('*, requirements(*)')
        .eq('name', name)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null // Não encontrado
        }
        throw error
      }
      if (!data || !data.requirements) {
        // Garante que mesmo digimons sem requisitos sejam retornados
        if (data) data.requirements = { stats: [], other: [] };
        return data;
      }
        const grouped = {
          stats: [],
          other: []
        };        
        data.requirements.forEach(req => {
          if (req.type === 'stat') {
            grouped.stats.push({
              name: req.name,
              value: req.value,
              description: req.description
            });
          } else {
            grouped.other.push({
              name: req.name,
              value: req.value,
              description: req.description
            });
          }
        });
        // Substitui a lista de requis  itos pela estrutura agrupada
        data.requirements = grouped;
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
      if (!searchTerm || searchTerm.trim() === '') {
        return [];
      }

      const { data, error } = await supabase
        .from('digimons')
        .select('*')
        .ilike('name', `${searchTerm}%`) 
        .limit(limit)
        .order('number', { ascending: true });

      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      throw new Error(`Erro na busca: ${error.message}`);
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
          to_digimon:digimons!evolutions_to_digimon_id_fkey (
            id,
            number,
            name,
            stage,
            attribute,
            image_url,
            requirements (
              name,
              value,
              description,
              type
            )
          )
        `)
        .eq('from_digimon_id', digimonId);
      
      if (error) {
        throw error;
      }
      
      // O Supabase retorna os dados, mas precisamos processá-los
      // para agrupar os requisitos como você já faz.
      const evolutionsWithGroupedRequirements = data
        .map(item => {
          const digimon = item.to_digimon;
          if (!digimon) return null;

          // Agrupa os requisitos (lógica que você já tinha em getDigimonRequirements)
          const grouped = {
            stats: [],
            other: []
          };
          
          digimon.requirements.forEach(req => {
            if (req.type === 'stat') {
              grouped.stats.push({
                name: req.name,
                value: req.value,
                description: req.description
              });
            } else {
              grouped.other.push({
                name: req.name,
                value: req.value,
                description: req.description
              });
            }
          });

          // Remove a lista original de requisitos e adiciona a agrupada
          delete digimon.requirements;
          digimon.requirements = grouped;

          return digimon;
        })
        .filter(Boolean); // Remove nulos se houver

      return evolutionsWithGroupedRequirements;
    } catch (error) {
      throw new Error(`Erro ao buscar evoluções com requisitos: ${error.message}`);
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
            image_url
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
        .from('requirements')
        .select('*')
        .eq('digimon_id', digimonId)
        .order('type', { ascending: true })
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
        if (req.type === 'stat') {
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
   * Constrói uma árvore aninhada a partir de uma lista plana.
   * @param {Array} list - A lista de nós.
   * @param {string} parentField - O nome do campo que indica o pai/filho.
   * @param {number | null} startId - O ID para iniciar a montagem.
   * @param {Set} visited - Para prevenção de ciclos.
   */
  buildTree = (list, parentField, startId, visited = new Set()) => {
    if (visited.has(startId)) {
      return [];
    }
    visited.add(startId);

    const children = list.filter(item => item[parentField] === startId);
    
    if (children.length === 0) {
      return [];
    }

    const tree = children.map(child => {
      const nextLevelVisited = new Set(visited);
      
      // --- A CORREÇÃO ESTÁ AQUI ---
      return {
        id: child.id,
        name: child.name,
        stage: child.stage,
        number: child.number,
        attribute: child.attribute,
        image_url: child.image_url,
        requirements: child.requirements, // Adicione esta linha!
        evolutions: this.buildTree(list, parentField, child.id, nextLevelVisited)
      };
    });

    return tree;
  }

  async getEvolutionLine(digimonName) {
    try {
      // Chama a nova função RPC super otimizada
      const { data, error } = await supabase.rpc('get_evolution_tree_by_name', {
        digimon_name_param: digimonName
      });
  
      if (error) {
        // Log detalhado no servidor para depuração
        console.error(`RPC Error for '${digimonName}':`, error);
        throw new Error(`Erro na consulta RPC: ${error.message}`);
      }
  
      if (!data) {
        // Caso a RPC retorne nulo por algum motivo inesperado
        throw new Error('A consulta RPC não retornou dados.');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
  
      // Os dados já vêm perfeitamente estruturados do banco de dados
      return {
        current: data.current,
        predecessors: data.predecessors || [],
        successors: data.successors || []
      };
  
    } catch (error) {
      console.error(`Falha crítica ao carregar árvore evolutiva para ${digimonName}:`, error);
      // Retorna um erro padronizado para o cliente
      throw new Error(`Não foi possível carregar a árvore evolutiva. Tente novamente mais tarde.`);
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
  // Dentro da classe DigimonService

  /**
   * Busca recursivamente a linha evolutiva em uma direção (sucessores ou predecessores).
   * @param {string} digimonId - O ID do Digimon para iniciar a busca.
   * @param {'successors' | 'predecessors'} direction - A direção da busca.
   * @param {Set<string>} visited - Um conjunto de IDs já visitados para evitar loops.
   * @returns {Promise<Array<Object>>} - Uma lista de Digimons na linha evolutiva.
   */
  async getEvolutionLineRecursive(digimonId, direction, visited = new Set()) {
    // 1. Condição de parada: Se já visitamos este ID, paramos para evitar loops.
    if (visited.has(digimonId)) {
      return [];
    }
    visited.add(digimonId);

    // 2. Determina qual função usar com base na direção
    const getNextEvolutions = direction === 'successors' 
      ? this.getDigimonEvolutions.bind(this)
      : this.getDigimonPreEvolutions.bind(this);

    // 3. Busca o próximo nível de evoluções/pré-evoluções
    const evolutions = await getNextEvolutions(digimonId);

    // Se não houver mais evoluções, retorna um array vazio.
    if (!evolutions || evolutions.length === 0) {
      return [];
    }

    // 4. Inicia a lista de resultados com as evoluções diretas encontradas
    let results = [...evolutions];

    // 5. Para cada evolução encontrada, chama a função recursivamente
    for (const evo of evolutions) {
      const nextLine = await this.getEvolutionLineRecursive(evo.id, direction, visited);
      // Concatena os resultados da chamada recursiva
      results = results.concat(nextLine);
    }

    // 6. Remove duplicados antes de retornar. Isso pode acontecer em árvores complexas.
    // O primeiro a ser encontrado (mais próximo do original) é mantido.
    return results.filter((value, index, self) => 
      self.findIndex(d => d.id === value.id) === index
    );
  }
  /**
 * NOVA FUNÇÃO: Constrói uma árvore de evolução aninhada a partir de um Digimon.
 * @param {string} digimonId - O ID do Digimon raiz da árvore.
 * @param {'successors' | 'predecessors'} direction - Direção da busca.
 * @param {number} maxDepth - Profundidade máxima da recursão para evitar sobrecarga.
 * @param {Set<string>} visited - Para evitar loops infinitos.
 * @returns {Promise<Array<Object>>} - Uma árvore de Digimons.
 */
  async buildEvolutionTree(digimonId, direction, maxDepth = 10, visited = new Set()) {
    // Condição de parada: profundidade máxima ou ciclo detectado.
    if (maxDepth <= 0 || visited.has(digimonId)) {
      return [];
    }
    visited.add(digimonId);

    // Determina a função de busca (evoluções ou pré-evoluções).
    const getNext = direction === 'successors' 
      ? this.getDigimonEvolutions.bind(this) 
      : this.getDigimonPreEvolutions.bind(this);

    const evolutions = await getNext(digimonId);
    if (!evolutions || evolutions.length === 0) {
      return [];
    }

    const tree = [];

    for (const evo of evolutions) {
      // Para cada evolução, busca a sub-árvore dela.
      const nextLevelEvolutions = await this.buildEvolutionTree(
        evo.id, 
        direction, 
        maxDepth - 1, 
        new Set(visited) // Passa uma cópia do 'visited' para cada galho da árvore.
      );
      
      tree.push({
        ...evo, // Mantém todos os dados do Digimon (id, name, stage, etc.)
        evolutions: nextLevelEvolutions // Aninha o próximo nível
      });
    }

    return tree;
  }
}
