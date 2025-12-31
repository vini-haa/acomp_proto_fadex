// Script para verificar se as tabelas necessárias existem
require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

async function checkTables() {
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
  };

  try {
    const pool = await sql.connect(config);

    console.log('📋 Verificando tabelas necessárias no banco "fade1"...\n');

    const tables = [
      'scd_movimentacao',
      'documento',
      'convenio',
      'setor',
      'cc',
      'conv_cc',
      'INSTITUICAO',
      'InstUnidDepto'
    ];

    for (const table of tables) {
      const result = await pool.request().query(`
        SELECT COUNT(*) as existe,
               (SELECT TOP 1 COUNT(*) FROM ${table}) as qtd_registros
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = '${table}'
      `);

      const existe = result.recordset[0].existe > 0;
      const qtd = existe ? result.recordset[0].qtd_registros : 0;

      if (existe) {
        console.log(`✅ ${table.padEnd(20)} - ${qtd.toLocaleString('pt-BR')} registros`);
      } else {
        console.log(`❌ ${table.padEnd(20)} - NÃO ENCONTRADA`);
      }
    }

    console.log('\n📊 Verificando se o código de setor financeiro (48) existe...\n');

    const setorFinanceiro = await pool.request().query(`
      SELECT codigo, descr
      FROM setor
      WHERE codigo = 48
    `);

    if (setorFinanceiro.recordset.length > 0) {
      console.log('✅ Setor Financeiro encontrado:');
      console.log(`   Código: ${setorFinanceiro.recordset[0].codigo}`);
      console.log(`   Descrição: ${setorFinanceiro.recordset[0].descr}`);
    } else {
      console.log('⚠️  Setor com código 48 não encontrado!');
      console.log('   A view espera que o setor financeiro tenha código 48.');
      console.log('   Verifique qual é o código correto do setor financeiro.');
    }

    await pool.close();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkTables();
