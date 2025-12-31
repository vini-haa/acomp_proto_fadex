/**
 * Testes para normalizarAssunto
 */

import { normalizarAssunto, ASSUNTOS_NORMALIZADOS } from "@/lib/constants/assuntos";

describe("normalizarAssunto", () => {
  // Testes para valores nulos/vazios
  describe("valores nulos e vazios", () => {
    it('deve retornar "(Sem Assunto)" para null', () => {
      expect(normalizarAssunto(null)).toBe("(Sem Assunto)");
    });

    it('deve retornar "(Sem Assunto)" para undefined', () => {
      expect(normalizarAssunto(undefined)).toBe("(Sem Assunto)");
    });

    it('deve retornar "(Sem Assunto)" para string vazia', () => {
      expect(normalizarAssunto("")).toBe("(Sem Assunto)");
    });

    it('deve retornar "(Sem Assunto)" para string com apenas espaços', () => {
      expect(normalizarAssunto("   ")).toBe("(Sem Assunto)");
    });
  });

  // Testes para rubricas orçamentárias (33.xx.xx e 44.xx.xx)
  describe("rubricas orçamentárias", () => {
    it("deve normalizar diárias (33.90.14)", () => {
      expect(normalizarAssunto("33.90.14 - DIÁRIAS CIVIL")).toBe("33.90.14 - DIÁRIAS");
      expect(normalizarAssunto("33.90.14")).toBe("33.90.14 - DIÁRIAS");
    });

    it("deve normalizar bolsas (33.90.18)", () => {
      expect(normalizarAssunto("33.90.18 - BOLSA PESQUISA")).toBe("33.90.18 - BOLSA");
    });

    it("deve normalizar bolsas pesquisador (33.90.20)", () => {
      expect(normalizarAssunto("33.90.20 - BOLSAS PESQUISADOR")).toBe(
        "33.90.20 - BOLSAS PESQUISADOR"
      );
    });

    it("deve normalizar material de consumo (33.90.30)", () => {
      expect(normalizarAssunto("33.90.30 - MATERIAL CONSUMO")).toBe(
        "33.90.30 - MATERIAL DE CONSUMO"
      );
    });

    it("deve normalizar passagens (33.90.33)", () => {
      expect(normalizarAssunto("33.90.33 - PASSAGEM")).toBe("33.90.33 - PASSAGENS E LOCOMOÇÃO");
    });

    it("deve normalizar serviços PF (33.90.36)", () => {
      expect(normalizarAssunto("33.90.36 - SERVIÇOS")).toBe("33.90.36 - SERVIÇOS PF");
    });

    it("deve normalizar serviços PJ (33.90.39)", () => {
      expect(normalizarAssunto("33.90.39 - SERVICOS PJ")).toBe("33.90.39 - SERVIÇOS PJ");
    });

    it("deve normalizar material permanente (44.90.52)", () => {
      expect(normalizarAssunto("44.90.52 - EQUIPAMENTO")).toBe("44.90.52 - MATERIAL PERMANENTE");
    });
  });

  // Testes para palavras-chave
  describe("palavras-chave", () => {
    it("deve identificar bolsas", () => {
      expect(normalizarAssunto("PAGAMENTO DE BOLSA")).toBe("33.90.18 - BOLSA");
      expect(normalizarAssunto("BOLSISTA PROJETO X")).toBe("33.90.18 - BOLSA");
    });

    it("deve identificar bolsas pesquisador antes de bolsa genérica", () => {
      expect(normalizarAssunto("BOLSA PESQUISADOR CNPq")).toBe("33.90.20 - BOLSAS PESQUISADOR");
    });

    it("deve identificar diárias", () => {
      expect(normalizarAssunto("DIARIA REUNIAO")).toBe("33.90.14 - DIÁRIAS");
      expect(normalizarAssunto("DIÁRIA VIAGEM")).toBe("33.90.14 - DIÁRIAS");
    });

    it("deve identificar passagens", () => {
      expect(normalizarAssunto("PASSAGEM AÉREA")).toBe("33.90.33 - PASSAGENS E LOCOMOÇÃO");
      expect(normalizarAssunto("DESLOCAMENTO TERRESTRE")).toBe("33.90.33 - PASSAGENS E LOCOMOÇÃO");
    });

    it("deve identificar serviços PF", () => {
      expect(normalizarAssunto("CONTRATO PF")).toBe("33.90.36 - SERVIÇOS PF");
      expect(normalizarAssunto("PESSOA FISICA")).toBe("33.90.36 - SERVIÇOS PF");
    });

    it("deve identificar serviços PJ", () => {
      expect(normalizarAssunto("CONTRATO PJ")).toBe("33.90.39 - SERVIÇOS PJ");
      expect(normalizarAssunto("PESSOA JURIDICA")).toBe("33.90.39 - SERVIÇOS PJ");
    });

    it("deve identificar suprimento de fundos", () => {
      expect(normalizarAssunto("SUPRIMENTO DE FUNDOS")).toBe("SUPRIMENTO DE FUNDOS");
    });

    it("deve identificar prestação de contas", () => {
      expect(normalizarAssunto("PRESTAÇÃO DE CONTAS FINAL")).toBe("PRESTAÇÃO DE CONTAS");
    });

    it("deve identificar remanejamento", () => {
      expect(normalizarAssunto("REMANEJAMENTO ORÇAMENTÁRIO")).toBe("REMANEJAMENTO");
    });
  });

  // Testes para case insensitive
  describe("case insensitive", () => {
    it("deve funcionar independente de maiúsculas/minúsculas", () => {
      expect(normalizarAssunto("bolsa")).toBe("33.90.18 - BOLSA");
      expect(normalizarAssunto("BOLSA")).toBe("33.90.18 - BOLSA");
      expect(normalizarAssunto("Bolsa")).toBe("33.90.18 - BOLSA");
    });
  });

  // Testes para "OUTROS"
  describe('categoria "OUTROS"', () => {
    it('deve retornar "OUTROS" para assuntos não classificados', () => {
      expect(normalizarAssunto("XPTO QUALQUER COISA")).toBe("OUTROS");
      expect(normalizarAssunto("DOCUMENTO AVULSO")).toBe("OUTROS");
    });
  });

  // Teste para garantir que os assuntos normalizados estão na lista
  describe("consistência com ASSUNTOS_NORMALIZADOS", () => {
    it("deve retornar apenas valores da lista ASSUNTOS_NORMALIZADOS", () => {
      const testCases = [
        null,
        "",
        "BOLSA",
        "DIÁRIA",
        "33.90.14",
        "44.90.52",
        "SUPRIMENTO DE FUNDOS",
        "XPTO",
      ];

      testCases.forEach((input) => {
        const result = normalizarAssunto(input);
        expect(ASSUNTOS_NORMALIZADOS).toContain(result);
      });
    });
  });
});
