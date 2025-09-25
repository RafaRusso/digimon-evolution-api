// src/config/supabase.js

import { createClient } from '@supabase/supabase-js';

// As variáveis já foram validadas no server.js, então podemos usá-las com segurança.
const supabaseUrl = 'https://wgwxsamufdapeyxfumxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd3hzYW11ZmRhcGV5eGZ1bXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTAxMTcsImV4cCI6MjA3NDM4NjExN30.Rv8mzfpMTMFhfgvzUXD361_Bf6GeshMp5MrEux9TAeo';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- FUNÇÃO DE TESTE MODIFICADA COM LOGS ---
export async function testConnection() {
  console.log('[Supabase] Iniciando teste de conexão...');
  
  try {
    // IMPORTANTE: Substitua 'digimons' pelo nome REAL de uma de suas tabelas no Supabase.
    // Se a tabela não existir, a query pode travar ou falhar de formas estranhas.
    const tableName = 'digimons'; 
    console.log(`[Supabase] Tentando executar query de teste na tabela: "${tableName}"`);

    const { error } = await supabase
      .from(tableName)
      .select('id') // Selecione apenas uma coluna pequena como 'id' para ser mais rápido.
      .limit(1);

    // Se chegarmos aqui, a query terminou (com ou sem erro).
    console.log('[Supabase] Query de teste concluída.');

    if (error) {
      // Se houver um erro de API (ex: tabela não encontrada, violação de RLS)
      console.error('[Supabase] Erro retornado pela API do Supabase:', error.message);
      throw error; // Lança o erro para ser pego pelo catch abaixo.
    }

    console.log('[Supabase] Teste de conexão bem-sucedido.');
    return { success: true };

  } catch (err) {
    // Se houver um erro de rede ou o erro lançado acima.
    console.error('[Supabase] Falha crítica no teste de conexão:', err.message);
    return { success: false, message: err.message };
  }
}
