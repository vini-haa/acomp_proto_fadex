"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X } from "lucide-react";
import { FilterOptions } from "./types";
import { formatProtocoloNumber } from "./utils";

interface FilterRowProps {
  // State values
  status: string;
  numeroDocumento: string;
  numconv: string;
  faixaTempo: string;
  contaCorrente: string;
  setorAtual: string;
  assunto: string;
  excluirLotePagamento: boolean;
  effectiveOptions: FilterOptions | null;
  hasFilters: boolean;
  // Setters
  setStatus: (value: string) => void;
  setNumeroDocumento: (value: string) => void;
  setNumconv: (value: string) => void;
  setFaixaTempo: (value: string) => void;
  setContaCorrente: (value: string) => void;
  setSetorAtual: (value: string) => void;
  setAssunto: (value: string) => void;
  setExcluirLotePagamento: (value: boolean) => void;
  // Actions
  handleApplyFilters: () => void;
  handleClearFilters: () => void;
}

export function FilterRow({
  status,
  numeroDocumento,
  numconv,
  faixaTempo,
  contaCorrente,
  setorAtual,
  assunto,
  excluirLotePagamento,
  effectiveOptions,
  hasFilters,
  setStatus,
  setNumeroDocumento,
  setNumconv,
  setFaixaTempo,
  setContaCorrente,
  setSetorAtual,
  setAssunto,
  setExcluirLotePagamento,
  handleApplyFilters,
  handleClearFilters,
}: FilterRowProps) {
  return (
    <>
      {/* Linha 1: Status, Tempo no Setor, Setor Atual, Tipo de Rubrica */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Filtro de Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Faixa de Tempo */}
        <div className="space-y-2">
          <Label htmlFor="faixaTempo">Tempo no Setor</Label>
          <Select value={faixaTempo} onValueChange={setFaixaTempo}>
            <SelectTrigger id="faixaTempo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="01. Até 5 dias">Até 5 dias</SelectItem>
              <SelectItem value="02. 6-15 dias">6-15 dias</SelectItem>
              <SelectItem value="03. 16-30 dias">16-30 dias</SelectItem>
              <SelectItem value="04. 31-60 dias">31-60 dias</SelectItem>
              <SelectItem value="05. Mais de 60 dias">Mais de 60 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Setor Atual */}
        <div className="space-y-2">
          <Label htmlFor="setorAtual">Setor Atual</Label>
          <Select
            key={`setor-select-${effectiveOptions?.setores?.length || 0}`}
            value={setorAtual}
            onValueChange={setSetorAtual}
          >
            <SelectTrigger id="setorAtual">
              <SelectValue placeholder="Todos os setores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os setores</SelectItem>
              {effectiveOptions?.setores?.map((setor) => (
                <SelectItem key={setor} value={setor}>
                  {setor.replace(/^- /, "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Tipo de Rubrica (Assunto Normalizado) */}
        <div className="space-y-2">
          <Label htmlFor="assunto">Tipo de Rubrica</Label>
          <Select
            key={`assunto-select-${effectiveOptions?.assuntos?.length || 0}`}
            value={assunto}
            onValueChange={setAssunto}
          >
            <SelectTrigger id="assunto">
              <SelectValue placeholder="Todas as rubricas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as rubricas</SelectItem>
              {effectiveOptions?.assuntos?.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha 2: Nº Convênio, CC do Projeto, Número do Protocolo, Botões */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Filtro de Número do Convênio (Projeto) */}
        <div className="space-y-2">
          <Label htmlFor="numconv">Nº Convênio/Projeto</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="numconv"
              placeholder="Ex: 123"
              value={numconv}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setNumconv(value);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              className="pl-8 font-mono"
              maxLength={10}
            />
          </div>
        </div>

        {/* Filtro de Conta Corrente - Campo de Pesquisa */}
        <div className="space-y-2">
          <Label htmlFor="contaCorrente">CC do Projeto</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="contaCorrente"
              placeholder="Ex: 11797 ou 11797-8"
              value={contaCorrente}
              onChange={(e) => {
                // Permite números e hífen (para dígito verificador)
                const value = e.target.value.replace(/[^\d-]/g, "");
                setContaCorrente(value);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              className="pl-8 font-mono"
              maxLength={12}
            />
          </div>
        </div>

        {/* Filtro de Número do Documento (Protocolo) */}
        <div className="space-y-2">
          <Label htmlFor="numeroDocumento">Número do Protocolo</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="numeroDocumento"
              placeholder="0000.000000.0000"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(formatProtocoloNumber(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              className="pl-8 font-mono"
              maxLength={16}
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-end gap-2">
          <Button onClick={handleApplyFilters} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button variant="outline" onClick={handleClearFilters} disabled={!hasFilters}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Linha 3: Opções adicionais */}
      <div className="flex items-center gap-4 pt-2 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="excluirLotes"
            checked={excluirLotePagamento}
            onCheckedChange={(checked) => setExcluirLotePagamento(checked === true)}
          />
          <Label htmlFor="excluirLotes" className="text-sm font-normal cursor-pointer">
            Ocultar Lotes de Pagamento
          </Label>
        </div>
      </div>
    </>
  );
}
