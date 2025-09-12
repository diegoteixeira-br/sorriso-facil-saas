import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, Clock, Settings, CalendarDays } from "lucide-react";
import CalendarioClinico from "@/components/CalendarioClinico";
import AgendaPorDentista from "@/components/AgendaPorDentista";
import BloqueiosFerias from "@/components/BloqueiosFerias";

const Agenda = () => {
  const [activeTab, setActiveTab] = useState("calendario");

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-medical rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">Agenda Clínica</h1>
            <p className="text-muted-foreground">Sistema completo de agendamentos para clínicas odontológicas</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="por-dentista" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Por Dentista
          </TabsTrigger>
          <TabsTrigger value="bloqueios" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Bloqueios/Férias
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendário Mensal</CardTitle>
              <CardDescription>
                Visualização geral dos agendamentos por mês com filtros por dentista
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarioClinico />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="por-dentista" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda por Dentista</CardTitle>
              <CardDescription>
                Visualização detalhada da agenda diária de cada dentista
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgendaPorDentista />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bloqueios" className="space-y-4">
          <BloqueiosFerias />
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Horários de Funcionamento</CardTitle>
                <CardDescription>
                  Configure os horários padrão de atendimento da clínica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Em desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Configuração de horários será implementada em breve
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Espera</CardTitle>
                <CardDescription>
                  Gerencie pacientes em lista de espera para horários vagos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Em desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Sistema de lista de espera será implementado em breve
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Agenda</CardTitle>
                <CardDescription>
                  Visualize estatísticas de agendamentos, faltas e ocupação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Em desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Relatórios de agenda serão implementados em breve
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Agenda;