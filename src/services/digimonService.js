// src/services/digimonService.js

import { supabase } from '../config/supabase.js';

// Função auxiliar para formatar os dados, evitando repetição
function formatDigimon(digimon) {
  if (!digimon) return null;
  return {
    id: digimon.id,
    number: digimon.number,
    name: digimon.name,
    stage: digimon.stage,
    attribute: digimon.attribute,
    image_url: digimon.image_url,
  };
}

export class DigimonService {

  /**
   * Busca todos os Digimons com paginação e filtro opcional por stage.
   */
  async getAllDigimons({ page = 1, limit = 50, stage }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('digimons')
      .select('*', { count: 'exact' }) // 'exact' para obter a contagem total
      .order('number', { ascending: true })
      .range(from, to);

    // Aplica o filtro de stage se ele for fornecido
    if (stage) {
      query = query.eq('stage', stage);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro em getAllDigimons:', error);
      throw new Error('Não foi possível buscar os Digimons.');
    }

    return {
      data: data.map(formatDigimon),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Busca um Digimon pelo seu ID numérico.
   */
  async getDigimonById(id) {
    const { data, error } = await supabase
      .from('digimons')
      .select('*')
      .eq('id', id)
      .single(); // .single() retorna um objeto em vez de um array

    if (error && error.code !== 'PGRST116') { // PGRST116 é o erro "nenhuma linha encontrada", o que é ok
      console.error('Erro em getDigimonById:', error);
      throw new Error('Erro ao buscar Digimon por ID.');
    }

    return formatDigimon(data);
  }

  /**
   * Busca um Digimon pelo seu nome exato.
   */
  async getDigimonByName(name) {
    const { data, error } = await supabase
      .from('digimons')
      .select('*')
      .eq('name', name)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro em getDigimonByName:', error);
      throw new Error('Erro ao buscar Digimon por nome.');
    }

    return formatDigimon(data);
  }

  /**
   * Busca Digimons usando uma pesquisa de texto parcial.
   */
  async searchDigimons({ searchTerm, limit = 10 }) {
    const { data, error } = await supabase
      .from('digimons')
      .select('*')
      .ilike('name', `%${searchTerm}%`) // 'ilike' é case-insensitive
      .limit(limit);

    if (error) {
      console.error('Erro em searchDigimons:', error);
      throw new Error('Erro ao pesquisar Digimons.');
    }

    return data.map(formatDigimon);
  }

  /**
   * Busca os dados completos de evolução (próximas, anteriores e requisitos).
   */
  async getEvolutionData(id) {
    // 1. Busca o Digimon principal
    const digimon = await this.getDigimonById(id);
    if (!digimon) return { digimon: null };

    // 2. Busca as próximas evoluções (JOIN na tabela evolutions)
    const { data: evolvesTo, error: evolvesToError } = await supabase
      .from('evolutions')
      .select('to_digimon:digimons!evolutions_to_digimon_id_fkey (*)')
      .eq('from_digimon_id', id);

    // 3. Busca as pré-evoluções
    const { data: evolvesFrom, error: evolvesFromError } = await supabase
      .from('evolutions')
      .select('from_digimon:digimons!evolutions_from_digimon_id_fkey (*)')
      .eq('to_digimon_id', id);

    // 4. Busca os requisitos
    const { data: requirements, error: reqError } = await supabase
      .from('requirements')
      .select('*')
      .eq('digimon_id', id);

    if (evolvesToError || evolvesFromError || reqError) {
        console.error({ evolvesToError, evolvesFromError, reqError });
        throw new Error('Erro ao buscar dados de evolução.');
    }

    return {
      digimon: digimon,
      evolves_to: evolvesTo.map(e => formatDigimon(e.to_digimon)),
      evolves_from: evolvesFrom.map(e => formatDigimon(e.from_digimon)),
      requirements: requirements,
    };
  }

  /**
   * Obtém estatísticas gerais.
   */
  async getStats() {
    const { count: totalDigimons, error: totalError } = await supabase
      .from('digimons')
      .select('*', { count: 'exact', head: true });

    const { data: stages, error: stagesError } = await supabase
      .rpc('count_digimons_by_stage'); // Supabase RPC para funções customizadas

    if (totalError || stagesError) {
      console.error({ totalError, stagesError });
      throw new Error('Erro ao buscar estatísticas.');
    }

    return {
      total_digimons: totalDigimons,
      count_by_stage: stages,
    };
  }
}
