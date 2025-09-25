// scripts/seed.js
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Polyfill para o Supabase client no Node

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = 'https://wgwxsamufdapeyxfumxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd3hzYW11ZmRhcGV5eGZ1bXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTAxMTcsImV4cCI6MjA3NDM4NjExN30.Rv8mzfpMTMFhfgvzUXD361_Bf6GeshMp5MrEux9TAeo';

if (!supabaseUrl || !supabaseKey) {
  console.error('🔥 Erro: Variáveis de ambiente do Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { fetch }
});

// Carregar o arquivo JSON
const dataPath = path.join(process.cwd(), '.', 'digimon_data.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);

async function seedDatabase() {
  try {
    console.log('--- Iniciando o processo de seeding ---');

    // --- PASSO 1: Inserir todos os Digimons ---
    console.log('🌱 1/3: Inserindo Digimons...');
    const digimonList = Object.values(data.digimons).map(d => ({
      number: d.number,
      name: d.name,
      stage: d.stage,
      attribute: d.attribute,
      image_url: d.image,
    }));

    const { error: digimonError } = await supabase.from('digimons').insert(digimonList);
    if (digimonError) throw new Error(`Erro ao inserir Digimons: ${digimonError.message}`);
    console.log(`✅ ${digimonList.length} Digimons inseridos com sucesso.`);

    // --- PASSO 2: Mapear nomes para IDs para criar as relações ---
    console.log('🗺️ Mapeando nomes de Digimon para IDs...');
    const { data: allDigimons, error: fetchError } = await supabase.from('digimons').select('id, name');
    if (fetchError) throw new Error(`Erro ao buscar IDs: ${fetchError.message}`);
    
    const nameToIdMap = new Map(allDigimons.map(d => [d.name, d.id]));
    console.log('✅ Mapeamento concluído.');

    // --- PASSO 3: Inserir as Evoluções ---
    console.log('🧬 2/3: Inserindo Evoluções...');
    const evolutionList = [];
    for (const fromName in data.evolutions) {
      const fromId = nameToIdMap.get(fromName);
      if (!fromId) continue;

      for (const toName of data.evolutions[fromName]) {
        const toId = nameToIdMap.get(toName);
        if (toId) {
          evolutionList.push({ from_digimon_id: fromId, to_digimon_id: toId });
        }
      }
    }

    const { error: evolutionError } = await supabase.from('evolutions').insert(evolutionList);
    if (evolutionError) throw new Error(`Erro ao inserir Evoluções: ${evolutionError.message}`);
    console.log(`✅ ${evolutionList.length} relações de evolução inseridas.`);

    // --- PASSO 4: Inserir os Requisitos ---
    console.log('📋 3/3: Inserindo Requisitos...');
    const requirementsList = [];
    for (const digimonName in data.digimon_requirements) {
        const digimonId = nameToIdMap.get(digimonName);
        if (!digimonId) continue;

        const reqs = data.digimon_requirements[digimonName];
        
        if (reqs.stats) {
            reqs.stats.forEach(r => requirementsList.push({
                digimon_id: digimonId,
                type: 'stat',
                name: r.name,
                value: r.value.toString(),
                operator: r.operator,
                description: r.description
            }));
        }
        if (reqs.other) {
            reqs.other.forEach(r => requirementsList.push({
                digimon_id: digimonId,
                type: 'other',
                name: r.name,
                value: r.value,
                description: r.description
            }));
        }
    }

    const { error: reqError } = await supabase.from('requirements').insert(requirementsList);
    if (reqError) throw new Error(`Erro ao inserir Requisitos: ${reqError.message}`);
    console.log(`✅ ${requirementsList.length} requisitos inseridos.`);


    console.log('\n--- 🎉 Seeding concluído com sucesso! ---');

  } catch (error) {
    console.error('\n--- ❌ Erro durante o seeding ---');
    console.error(error.message);
    process.exit(1);
  }
}

seedDatabase();
