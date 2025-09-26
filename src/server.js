import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

// Importar funções e rotas
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { testConnection } from './config/supabase.js';
import digimonRoutes from './routes/digimons.js';
import healthRoutes from './routes/health.js';

// --- PASSO 1: Carregar e Validar Variáveis de Ambiente ---
// Isso é a primeira coisa que o script faz.
dotenv.config();

const {
  PORT,
  HOST,
  CORS_ORIGIN,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} = process.env;

// Validação crítica: Se as chaves do Supabase não existirem, o servidor não deve nem tentar iniciar.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("🔥🔥🔥 ERRO CRÍTICO: As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias.");
  console.error("Verifique se você criou um arquivo .env na raiz do projeto 'digimon-api'.");
  process.exit(1); // Encerra o processo imediatamente com um código de erro.
}

const fastify = Fastify({
  logger: true // É bom ter logs em desenvolvimento
})
// --- PASSO 3: Função Principal de Inicialização ---
async function startServer() {
  try {
    console.log('🔌 Registrando plugins...');
    // CORS: Permite que seu frontend (ex: localhost:3000) acesse a API
    await fastify.register(cors, {
      origin: '*', 
      methods: ['GET']
    } );

    // Helmet para segurança básica
    await fastify.register(helmet, { contentSecurityPolicy: false });

    // Rate Limiting para evitar abuso
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    // Swagger para documentação da API
    await fastify.register(swagger, {
      swagger: {
        info: {
          title: 'Digimon Evolution API',
          description: 'API para consulta de dados de Digimons e suas evoluções.',
          version: '1.0.0',
        },
        host: `localhost:${PORT || 3001}`,
        schemes: ['http'],
        tags: [
          { name: 'Health', description: 'Verificação de status da API' },
          { name: 'Digimons', description: 'Operações com Digimons' },
        ],
      },
    } );

    // Interface gráfica do Swagger
    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
    });

    console.log('🔗 Registrando rotas...');
    // Rota raiz para uma mensagem de boas-vindas
    fastify.get('/', () => ({
      message: 'Bem-vindo à Digimon Evolution API!',
      docs: '/docs',
    }));

    // Registrar as rotas dos seus módulos
    await fastify.register(healthRoutes, { prefix: '/health' });
    await fastify.register(digimonRoutes, { prefix: '/api/digimons' });

    console.log('🔧 Configurando handlers de erro...');
    fastify.setErrorHandler(errorHandler);
    fastify.setNotFoundHandler(notFoundHandler);

    console.log('📡 Testando conexão com o banco de dados...');
    const connection = await testConnection();
    if (!connection.success) {
      // O erro já foi validado no início, mas esta é uma segunda verificação.
      throw new Error(`Falha na conexão com o Supabase: ${connection.message}`);
    }
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');

    // Iniciar o servidor
    const serverHost = HOST || '0.0.0.0';
    const serverPort = parseInt(PORT) || 3001;

    await fastify.listen({ host: serverHost, port: serverPort });

    // O logger do Fastify já exibe a mensagem de "servidor rodando",
    // mas podemos adicionar uma extra para a documentação.
    fastify.log.info(`📚 Documentação da API disponível em http://localhost:${serverPort}/docs` );

  } catch (error) {
    // Se qualquer passo acima falhar, o erro será capturado aqui.
    fastify.log.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// --- PASSO 4: Executar o Servidor ---
startServer();
