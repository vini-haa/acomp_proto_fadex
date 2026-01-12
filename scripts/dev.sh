#!/bin/bash
# Script de inicialização do servidor de desenvolvimento
# Garante que a porta 3001 esteja livre antes de iniciar

PORT=3001

echo "🔍 Verificando porta $PORT..."

# Encontra e mata processos na porta
PID=$(lsof -t -i:$PORT 2>/dev/null)

if [ -n "$PID" ]; then
    echo "⚠️  Processo encontrado na porta $PORT (PID: $PID)"
    echo "🔄 Encerrando processo..."
    kill -9 $PID 2>/dev/null
    sleep 1
    echo "✅ Porta $PORT liberada"
else
    echo "✅ Porta $PORT já está livre"
fi

# Inicia o servidor Next.js
echo "🚀 Iniciando servidor de desenvolvimento..."
exec next dev -p $PORT
