// Script para testar conexão com SQL Server
require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

async function testConnection() {
  const config = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
      enableArithAbort: true,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
  };

  console.log('📋 Configuração (sem senha):');
  console.log({
    server: config.server,
    port: config.port,
    database: config.database,
    user: config.user,
    password: '***',
    encrypt: config.options.encrypt,
    trustServerCertificate: config.options.trustServerCertificate,
  });
  console.log('');

  try {
    console.log('🔄 Tentando conectar ao SQL Server...');
    const pool = await sql.connect(config);

    console.log('✅ Conexão estabelecida!');
    console.log('');

    console.log('🔄 Testando query simples...');
    const result = await pool.request().query('SELECT 1 as result');

    console.log('✅ Query executada com sucesso!');
    console.log('Resultado:', result.recordset);
    console.log('');

    console.log('🔄 Verificando se a view existe...');
    const viewCheck = await pool.request().query(`
      SELECT COUNT(*) as existe
      FROM INFORMATION_SCHEMA.VIEWS
      WHERE TABLE_NAME = 'vw_ProtocolosFinanceiro'
    `);

    if (viewCheck.recordset[0].existe > 0) {
      console.log('✅ View vw_ProtocolosFinanceiro encontrada!');

      console.log('🔄 Testando query na view...');
      const viewResult = await pool.request().query(`
        SELECT TOP 5
          codprot,
          dt_entrada,
          status_protocolo
        FROM vw_ProtocolosFinanceiro
      `);

      console.log(`✅ View retornou ${viewResult.recordset.length} registros`);
      console.log('Exemplo de dados:', viewResult.recordset);
    } else {
      console.log('⚠️  View vw_ProtocolosFinanceiro NÃO encontrada!');
      console.log('Execute o script: database/create_view_protocolos_financeiro.sql');
    }

    await pool.close();
    console.log('');
    console.log('🎉 Teste concluído com sucesso!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    console.error('');
    console.error('Detalhes do erro:', error);
    process.exit(1);
  }
}

testConnection();
