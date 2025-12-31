"use client";

import { Header } from "@/components/dashboard/Header";
import { AssuntoTable } from "@/components/tables/AssuntoTable";

export default function AnalisePorAssuntoPage() {
  return (
    <>
      <Header
        title="Análise por Assunto"
        subtitle="Quantidade de protocolos agrupados por assunto"
      />
      <div className="p-6">
        <AssuntoTable />
      </div>
    </>
  );
}
