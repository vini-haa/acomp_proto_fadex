# Relatório de Sessão - 29/12/2025

## Projeto: Protocolos_acomp (Dashboard de Protocolos FADEX)

---

## Resumo da Sessão

Sessão de investigação e validação de dados do sistema de protocolos, focada em entender como o histórico completo de um protocolo é armazenado no banco de dados SAGI.

---

## Atividades Realizadas

### 1. Verificação do Status da Aplicação

- **Aplicação rodando:** PM2 com processo `dashboard-fadex-dev` ativo há 7+ horas
- **Porta:** 3000 (localhost)
- **Status:** Online, respondendo HTTP 200

### 2. Investigação do Histórico de Protocolo

#### Protocolo Analisado: `3216.121225.0096`

**Dados fornecidos pelo usuário (histórico do SAGI):**

| Data       | Hora     | Histórico                                                                                                                        |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 12/12/2025 | 18:39:10 | DOCUMENTO\PROTOCOLO CADASTRADO NO SISTEMA - SOLICITAÇÃO CADASTRADA COM LIBERAÇÃO REALIZADA!                                      |
| 12/12/2025 | 18:39:10 | EM ANÁLISE - PROTOCOLO/PROCESSO CADASTRADO PELO USUÁRIO DO SETOR E TRANSFERIDO PARA O SETOR - GERÊNCIA DE PROJETOS               |
| 17/12/2025 | 10:16:52 | PROTOCOLO/PROCESSO ASSOCIADO AO PAGAMENTO DE NÚMERO 4734880 (COMENTÁRIO ACRESCENTADO PELO USUÁRIO CARLA JULIANA BORGES DA SILVA) |
| 17/12/2025 | 10:16:52 | PROTOCOLO VINCULADO AO PAGAMENTO: BOLSA PESQUISA-(ARTHUR MONTEIRO CASSIANO) - VALOR: R$ 700.00                                   |
| 17/12/2025 | 10:16:52 | DATA PREVISTA PARA PAGAMENTO EM 23/12/2025 E PAGAMENTO EMITIDO EM 23/12/2025 - LOTE: 0215.171225.0003 - TIPO: TED                |

---

## Descobertas sobre a Estrutura do Banco

### Mapeamento das Tabelas Envolvidas

O histórico completo de um protocolo no SAGI é composto por dados de **múltiplas tabelas**:

#### 1. Tabela `documento`

- **Função:** Armazena os dados cadastrais do protocolo
- **Coluna chave:** `codigo` (PK)
- **Dados encontrados:**
  - Código: `4707814`
  - Número: `3216.121225.0096`
  - Data Cadastro: `12/12/2025`
  - Assunto: `BOLSA`

#### 2. Tabela `scd_movimentacao`

- **Função:** Registra movimentações entre setores
- **Colunas principais:** `CodProt`, `data`, `hora`, `codSetorOrigem`, `codSetorDestino`, `codSituacaoProt`, `codUsuario`, `obs`
- **Joins necessários:**
  - `setor` (coluna `DESCR` para nome do setor)
  - `situacaoProtocolo` (coluna `descricao` para situação)
  - `usuario` (coluna `nome` para usuário)
- **Dados encontrados:**
  - 1 movimentação: 12/12/2025 15:39:10 - EM ANÁLISE → GERÊNCIA DE PROJETOS

#### 3. Tabela `FINANCEIRO`

- **Função:** Registra pagamentos/lançamentos financeiros
- **Coluna chave para vínculo:** `CodProt`
- **Dados encontrados:**
  - Código: `4734880`
  - CodProt: `4707814` (vínculo com protocolo)
  - Beneficiário: `ARTHUR MONTEIRO CASSIANO`
  - Valor: `R$ 700,00`
  - Data Lançamento: `16/12/2025`
  - Liberado: `Sim`

#### 4. Tabelas de Lote de Pagamento

- `RemessaPagamentoLote` - Lotes de pagamento
- `RemessaPagamentoLoteFinanceiro` - Itens do lote (vincula financeiro ao lote)
- **Colunas:** `valorTransferencia`, `dataTransferencia`, `statusPagamento`

---

## Comparação: Histórico SAGI vs Banco

| Evento no SAGI                              | Tabela no Banco                         | Status        |
| ------------------------------------------- | --------------------------------------- | ------------- |
| Cadastro do protocolo                       | `documento.datacad`                     | ✅ Encontrado |
| Movimentação EM ANÁLISE → Gerência Projetos | `scd_movimentacao`                      | ✅ Encontrado |
| Associação ao pagamento 4734880             | `FINANCEIRO.CodProt`                    | ✅ Encontrado |
| Beneficiário e valor                        | `FINANCEIRO.NOMEPESSOA`, `VALORLIQUIDO` | ✅ Encontrado |
| Lote de pagamento TED                       | `RemessaPagamentoLote*`                 | ⚠️ Parcial    |

**Observação:** A diferença de horário (18:39 vs 15:39) é provavelmente questão de fuso horário (UTC vs Brasília).

---

## Estrutura das Tabelas Descobertas

### Colunas Importantes

```
protocolo: PROTOCOLO, CODUSU, CODDOC, ORIGEM, DESTINO, ASSUNTO, DATA, HORA

scd_movimentacao: codigo, CodProt, data, hora, codUsuario, obs, codSetorOrigem,
                  codSetorDestino, codSituacaoProt

setor: CODIGO, DESCR, financeiro, gerencia, projetos, arquivo

situacaoProtocolo: codigo, descricao

FINANCEIRO: CODIGO, CodProt, NOMEPESSOA, VALORBRUTO, VALORLIQUIDO, DTLANCAMENTO,
            LIBERADO, OBSERVACAO, COMPLEMENTO (+ centenas de outras colunas)
```

---

## Conclusões

### 1. API Atual do Dashboard

A API `/api/protocolos/[id]/timeline` consulta apenas a tabela `scd_movimentacao`, por isso retorna menos eventos que o histórico completo do SAGI.

### 2. Para Histórico Completo

Seria necessário agregar dados de:

- `documento` (cadastro inicial)
- `scd_movimentacao` (movimentações)
- `FINANCEIRO` (pagamentos vinculados via `CodProt`)
- `RemessaPagamentoLote*` (status de transferências bancárias)

### 3. Vínculo Protocolo-Pagamento

O vínculo entre protocolo e pagamento é feito pela coluna `CodProt` na tabela `FINANCEIRO`, que referencia o `codigo` da tabela `documento`.

---

## Próximos Passos Sugeridos

1. **Expandir API de Timeline:** Incluir dados da tabela `FINANCEIRO` onde `CodProt = codigo_protocolo`
2. **Exibir Pagamentos:** Mostrar pagamentos vinculados na página de detalhes do protocolo
3. **Status de TED:** Consultar `RemessaPagamentoLoteFinanceiro` para status de pagamentos bancários

---

## Ambiente

- **Servidor:** localhost:3000
- **PM2:** dashboard-fadex-dev (online)
- **Banco:** SQL Server (SAGI - fade1)
- **Framework:** Next.js 15.5.9

---

_Relatório gerado em 29/12/2025_
