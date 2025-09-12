import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Plane, Coffee, Calendar as CalendarLucide } from "lucide-react";

const BloqueiosFerias = () => {
  const [bloqueios] = useState([
    {
      id: '1',
      tipo: 'ferias',
      dentista: 'Dr. João Silva',
      data_inicio: '15/01/2024',
      data_fim: '30/01/2024',
      motivo: 'Férias anuais'
    },
    {
      id: '2',
      tipo: 'feriado',
      dentista: 'Todos os dentistas',
      data_inicio: '13/02/2024',
      data_fim: '13/02/2024',
      motivo: 'Carnaval'
    }
  ]);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ferias':
        return <Plane className="w-4 h-4" />;
      case 'folga':
        return <Coffee className="w-4 h-4" />;
      case 'feriado':
        return <CalendarLucide className="w-4 h-4" />;
      default:
        return <CalendarLucide className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ferias':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'folga':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'feriado':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Bloqueios e Férias</h2>
          <p className="text-muted-foreground">Gerencie férias, folgas e feriados</p>
        </div>
        <Button className="bg-gradient-medical">
          <Plus className="w-4 h-4 mr-2" />
          Novo Bloqueio
        </Button>
      </div>

      {/* Lista de Bloqueios */}
      <Card>
        <CardHeader>
          <CardTitle>Bloqueios Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bloqueios.map((bloqueio) => (
              <div key={bloqueio.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getTipoColor(bloqueio.tipo)}>
                      <div className="flex items-center gap-1">
                        {getTipoIcon(bloqueio.tipo)}
                        {bloqueio.tipo}
                      </div>
                    </Badge>
                    
                    <span className="text-sm font-medium">
                      {bloqueio.dentista}
                    </span>
                  </div>
                </div>

                <div className="text-sm space-y-1">
                  <div>
                    <strong>Período:</strong> {bloqueio.data_inicio} até {bloqueio.data_fim}
                  </div>
                  
                  {bloqueio.motivo && (
                    <div>
                      <strong>Motivo:</strong> {bloqueio.motivo}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades em desenvolvimento */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Futuras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">✅ Controle de Bloqueios</h4>
              <p className="text-sm text-muted-foreground">
                Sistema para bloquear horários específicos por dentista ou toda a clínica
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">📅 Gestão de Feriados</h4>
              <p className="text-sm text-muted-foreground">
                Configuração automática de feriados nacionais e locais
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">🏖️ Controle de Férias</h4>
              <p className="text-sm text-muted-foreground">
                Agendamento e aprovação de férias por dentista
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BloqueiosFerias;