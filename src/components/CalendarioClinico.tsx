import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, Stethoscope } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AgendarConsultaModal } from "./AgendarConsultaModal";

interface Agendamento {
  id: string;
  data_agendamento: string;
  duracao_minutos: number;
  status: string;
  observacoes?: string;
  procedimento?: string;
  paciente?: {
    nome: string;
  };
  dentista?: {
    nome: string;
  };
}

interface Dentista {
  id: string;
  nome: string;
  especialidade?: string;
}

const CalendarioClinico = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [selectedDentista, setSelectedDentista] = useState<string>("todos");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);

  const fetchAgendamentos = async () => {
    if (!user) return;

    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      let query = supabase
        .from('agendamentos')
        .select(`
          *,
          pacientes!inner(nome),
          dentistas!inner(nome)
        `)
        .eq('user_id', user.id)
        .gte('data_agendamento', startDate.toISOString())
        .lte('data_agendamento', endDate.toISOString())
        .order('data_agendamento');

      if (selectedDentista !== "todos") {
        query = query.eq('dentista_id', selectedDentista);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    }
  };

  const fetchDentistas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dentistas')
        .select('id, nome, especialidade')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;

      setDentistas(data || []);
    } catch (error) {
      console.error('Erro ao carregar dentistas:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAgendamentos(), fetchDentistas()]);
      setLoading(false);
    };

    loadData();
  }, [user, currentDate, selectedDentista]);

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Encontrar o primeiro domingo da grade do calendário
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    
    // Encontrar o último sábado da grade do calendário
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    // Gerar todos os dias da grade do calendário
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return days;
  };

  const getAgendamentosForDay = (date: Date) => {
    return agendamentos.filter(agendamento => 
      isSameDay(new Date(agendamento.data_agendamento), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'realizado':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-2xl font-semibold min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Select value={selectedDentista} onValueChange={setSelectedDentista}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por dentista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os dentistas</SelectItem>
              {dentistas.map((dentista) => (
                <SelectItem key={dentista.id} value={dentista.id}>
                  {dentista.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={() => setIsAgendamentoModalOpen(true)}
          className="bg-gradient-medical"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Consulta
        </Button>
      </div>

      {/* Grid do Calendário */}
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-3 text-center font-medium text-muted-foreground bg-muted/50">
                {day}
              </div>
            ))}
          </div>

          {/* Dias do calendário */}
          <div className="grid grid-cols-7">
            {generateCalendarDays().map((day) => {
              const dayAgendamentos = getAgendamentosForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toString()}
                  className={`min-h-[120px] p-2 border-r border-b cursor-pointer hover:bg-accent/50 transition-colors
                    ${!isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''}
                    ${isCurrentDay ? 'bg-primary/5 border-primary/20' : ''}
                  `}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1 max-h-[90px] overflow-y-auto">
                    {dayAgendamentos.map((agendamento) => (
                      <div
                        key={agendamento.id}
                        className={`text-xs p-1 rounded border text-center ${getStatusColor(agendamento.status)}`}
                      >
                        <div className="font-medium">
                          {formatTime(agendamento.data_agendamento)}
                        </div>
                        <div className="truncate">
                          {agendamento.paciente?.nome || 'Paciente não definido'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {dayAgendamentos.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      +{dayAgendamentos.length - 2} mais
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalhes do dia */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Agendamentos para {selectedDay && format(selectedDay, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDay && getAgendamentosForDay(selectedDay).length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
                <Button 
                  onClick={() => {
                    setSelectedDay(null);
                    setIsAgendamentoModalOpen(true);
                  }}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agendar Consulta
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDay && getAgendamentosForDay(selectedDay)
                  .sort((a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime())
                  .map((agendamento) => (
                    <div key={agendamento.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {formatTime(agendamento.data_agendamento)} 
                            ({agendamento.duracao_minutos}min)
                          </span>
                        </div>
                        <Badge className={getStatusColor(agendamento.status)}>
                          {agendamento.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{agendamento.paciente?.nome || 'Paciente não definido'}</span>
                      </div>

                      {agendamento.dentista && (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-muted-foreground" />
                          <span>{agendamento.dentista.nome}</span>
                        </div>
                      )}

                      {agendamento.procedimento && (
                        <div className="text-sm text-muted-foreground">
                          Procedimento: {agendamento.procedimento}
                        </div>
                      )}

                      {agendamento.observacoes && (
                        <div className="text-sm text-muted-foreground">
                          Obs: {agendamento.observacoes}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Agendamento */}
      <AgendarConsultaModal
        open={isAgendamentoModalOpen}
        onOpenChange={setIsAgendamentoModalOpen}
        onSuccess={() => {
          fetchAgendamentos();
          toast.success('Consulta agendada com sucesso!');
        }}
      />
    </div>
  );
};

export default CalendarioClinico;