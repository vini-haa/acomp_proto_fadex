#!/usr/bin/env node

/**
 * Script para criar a view vw_ProtocolosFinanceiro no banco de produção
 *
 * Uso: node database/create-view.js
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Carrega variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'FADEX',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
};

async function createView() {
  let pool = null;

  try {
    console.log('🔄 Conectando ao SQL Server...');
    console.log(`   Servidor: ${config.server}:${config.port}`);
    console.log(`   Banco: ${config.database}`);
    console.log('');

    // Conecta ao banco
    pool = await sql.connect(config);
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('');

    // Lê o script SQL
    const sqlFilePath = path.join(__dirname, 'create_view_protocolos_financeiro.sql');
    console.log('📄 Lendo script SQL...');
    let sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    // Remove o USE [FADEX] pois já estamos conectados ao banco correto
    sqlScript = sqlScript.replace(/USE \[FADEX\]\s*GO\s*/gi, '');

    // Divide o script em comandos individuais (separados por GO)
    const commands = sqlScript
      .split(/\bGO\b/gi)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('PRINT'));

    console.log(`📋 Encontrados ${commands.length} comandos SQL para executar`);
    console.log('');

    // Executa cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Pula comandos vazios ou comentários
      if (!command || command.length < 10) continue;

      try {
        console.log(`⚙️  Executando comando ${i + 1}/${commands.length}...`);
        const result = await pool.request().query(command);

        // Se houver resultados, mostra
        if (result.recordset && result.recordset.length > 0) {
          console.table(result.recordset);
        }

        console.log('   ✓ Comando executado com sucesso');
        console.log('');
      } catch (err) {
        // Se o erro for sobre a view já existir, ignora
        if (err.message.includes('already exists') || err.message.includes('já existe')) {
          console.log('   ⚠️  View já existe, continuando...');
          console.log('');
        } else {
          throw err;
        }
      }
    }

    // Testa a view
    console.log('🧪 Testando a view...');
    const testResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM vw_ProtocolosFinanceiro
    `);

    console.log('');
    console.log('✅ View criada e testada com sucesso!');
    console.log(`   Total de registros: ${testResult.recordset[0].total}`);
    console.log('');

    // Testa distribuição por status
    console.log('📊 Distribuição por status:');
    const statusResult = await pool.request().query(`
      SELECT
        status_protocolo,
        COUNT(*) AS quantidade
      FROM vw_ProtocolosFinanceiro
      GROUP BY status_protocolo
      ORDER BY status_protocolo
    `);

    console.table(statusResult.recordset);
    console.log('');

    console.log('🎉 Processo concluído com sucesso!');
    console.log('');
    console.log('Agora você pode reiniciar o servidor Next.js:');
    console.log('  npm run dev');
    console.log('');

  } catch (err) {
    console.error('');
    console.error('❌ Erro ao criar a view:');
    console.error('');
    console.error(`   Tipo: ${err.constructor.name}`);
    console.error(`   Mensagem: ${err.message}`);

    if (err.code) {
      console.error(`   Código: ${err.code}`);
    }

    if (err.number) {
      console.error(`   Número SQL: ${err.number}`);
    }

    console.error('');
    console.error('Stack trace:');
    console.error(err.stack);
    console.error('');

    process.exit(1);
  } finally {
    // Fecha a conexão
    if (pool) {
      await pool.close();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executa o script
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  Script de Criação da View vw_ProtocolosFinanceiro');
console.log('  Dashboard de Acompanhamento de Protocolos - FADEX');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

createView().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
