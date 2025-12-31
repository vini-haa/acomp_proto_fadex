#!/bin/bash

echo "=== TESTE DE TODOS OS ENDPOINTS ==="
echo ""

BASE_URL="http://localhost:3000"

# Função para testar endpoint
test_endpoint() {
  local name="$1"
  local url="$2"
  echo -n "Testing $name... "
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" = "200" ]; then
    echo "✅ OK ($status)"
  else
    echo "❌ FAIL ($status)"
  fi
}

echo "📊 API ENDPOINTS:"
test_endpoint "KPIs" "$BASE_URL/api/kpis"
test_endpoint "Protocolos List" "$BASE_URL/api/protocolos?page=1&pageSize=5"
test_endpoint "Alertas" "$BASE_URL/api/alertas"
test_endpoint "Analytics Temporal 7d" "$BASE_URL/api/analytics/temporal?periodo=7d"
test_endpoint "Analytics Temporal 30d" "$BASE_URL/api/analytics/temporal?periodo=30d"
test_endpoint "Analytics Distribuição" "$BASE_URL/api/analytics/distribuicao"
test_endpoint "Analytics Por Assunto" "$BASE_URL/api/analytics/por-assunto?limit=10"
test_endpoint "Analytics Por Projeto" "$BASE_URL/api/analytics/por-projeto?limit=10"
test_endpoint "Analytics Fluxo Setores" "$BASE_URL/api/analytics/fluxo-setores?limit=10"
test_endpoint "Analytics Heatmap" "$BASE_URL/api/analytics/heatmap"
test_endpoint "Analytics Comparativo" "$BASE_URL/api/analytics/comparativo"

echo ""
echo "🌐 PÁGINAS:"
test_endpoint "Dashboard Principal" "$BASE_URL/"
test_endpoint "Protocolos" "$BASE_URL/protocolos"
test_endpoint "Alertas Page" "$BASE_URL/alertas"
test_endpoint "Análise Temporal" "$BASE_URL/analises/temporal"
test_endpoint "Análise Por Assunto" "$BASE_URL/analises/por-assunto"
test_endpoint "Análise Por Projeto" "$BASE_URL/analises/por-projeto"
test_endpoint "Análise Por Setor" "$BASE_URL/analises/por-setor"

echo ""
echo "=== TESTE CONCLUÍDO ==="
