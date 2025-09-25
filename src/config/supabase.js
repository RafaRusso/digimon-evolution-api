import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias')
}
console.log(supabaseUrl)
console.log(supabaseKey)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // Para API, não precisamos de sessão persistente
  }
})

// Função para testar conexão
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('digimons')
      .select('count')
      .limit(1)
    
    if (error) {
      throw error
    }
    
    return { success: true, message: 'Conexão com Supabase estabelecida' }
  } catch (error) {
    return { success: false, message: `Erro na conexão: ${error.message}` }
  }
}
