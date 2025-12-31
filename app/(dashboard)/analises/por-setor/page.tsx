"use client";

import { Header } from "@/components/dashboard/Header";
import { Card, CardContent } from "@/components/ui/card";

export default function AnalisePorSetorPage() {
  return (
    <>
      <Header title="Análise por Setor" subtitle="Em desenvolvimento" />
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Página em desenvolvimento. Novos gráficos serão adicionados em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
