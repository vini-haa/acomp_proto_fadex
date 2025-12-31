/**
 * Testes para funções de situação
 */

import { SITUACOES, inferirSituacao, getSituacaoDescricao } from "@/lib/constants/situacoes";
import { SETORES } from "@/lib/constants/setores";

describe("inferirSituacao", () => {
  describe("quando situação já está preenchida", () => {
    it("deve manter situação existente se for válida", () => {
      expect(inferirSituacao(48, 62)).toBe(62);
      expect(inferirSituacao(52, 60)).toBe(60);
    });

    it("deve manter situação existente mesmo se setor indicar outra", () => {
      // Protocolo no arquivo mas com situação "Recebido" - mantém
      expect(inferirSituacao(52, 62)).toBe(62);
    });
  });

  describe("quando situação é null/undefined", () => {
    it("deve inferir ARQUIVADO para setores de arquivo", () => {
      SETORES.ARQUIVOS.forEach((setorArquivo) => {
        expect(inferirSituacao(setorArquivo, null)).toBe(SITUACOES.ARQUIVADO);
        expect(inferirSituacao(setorArquivo, undefined)).toBe(SITUACOES.ARQUIVADO);
      });
    });

    it("deve inferir ENCAMINHADO_JURIDICO para setor jurídico", () => {
      expect(inferirSituacao(SETORES.JURIDICO, null)).toBe(SITUACOES.ENCAMINHADO_JURIDICO);
    });

    it("deve inferir EM_ANALISE para gerência de projetos", () => {
      expect(inferirSituacao(SETORES.GERENCIA_PROJETOS, null)).toBe(SITUACOES.EM_ANALISE);
    });

    it("deve inferir RECEBIDO como fallback", () => {
      expect(inferirSituacao(SETORES.FINANCEIRO, null)).toBe(SITUACOES.RECEBIDO);
      expect(inferirSituacao(SETORES.ADMINISTRATIVO, null)).toBe(SITUACOES.RECEBIDO);
      expect(inferirSituacao(SETORES.SECRETARIA, null)).toBe(SITUACOES.RECEBIDO);
    });
  });

  describe("quando situação é 0 ou negativa", () => {
    it("deve tratar 0 como inválido e inferir", () => {
      expect(inferirSituacao(52, 0)).toBe(SITUACOES.ARQUIVADO);
    });
  });
});

describe("getSituacaoDescricao", () => {
  it("deve retornar descrição correta para cada situação", () => {
    expect(getSituacaoDescricao(60)).toBe("Arquivado");
    expect(getSituacaoDescricao(62)).toBe("Recebido");
    expect(getSituacaoDescricao(65)).toBe("Encaminhado para Jurídico");
    expect(getSituacaoDescricao(66)).toBe("Em Análise");
  });

  it('deve retornar "Desconhecida" para códigos não mapeados', () => {
    expect(getSituacaoDescricao(999)).toBe("Desconhecida");
    expect(getSituacaoDescricao(0)).toBe("Desconhecida");
  });
});

describe("SITUACOES constantes", () => {
  it("deve ter os valores corretos", () => {
    expect(SITUACOES.ARQUIVADO).toBe(60);
    expect(SITUACOES.RECEBIDO).toBe(62);
    expect(SITUACOES.ENCAMINHADO_JURIDICO).toBe(65);
    expect(SITUACOES.EM_ANALISE).toBe(66);
  });
});
