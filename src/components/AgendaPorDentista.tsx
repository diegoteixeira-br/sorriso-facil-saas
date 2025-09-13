import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, User, Plus } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
}

interface Dentista {
  id: string;
  nome: string;
  especialidade?: string;
}

const AgendaPorDentista = () => {
  const { user } = useAuth();
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [selectedDentista, setSelectedDentista] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);

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
      if (data && data.length > 0 && !selectedDentista) {
        setSelectedDentista(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar dentistas:', error);
      toast.error('Erro ao carregar dentistas');
    }
  };

  const fetchAgendamentos = async () => {
    if (!user || !selectedDentista) return;

    setLoading(true);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          pacientes(nome)
        `)
        .eq('user_id', user.id)
        .eq('dentista_id', selectedDentista)
        .gte('data_agendamento', startOfDay.toISOString())
        .lte('data_agendamento', endOfDay.toISOString())
        .order('data_agendamento');

      if (error) throw error;

      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDentistas();
  }, [user]);

  useEffect(() => {
    if (selectedDentista) {
      fetchAgendamentos();
    }
  }, [selectedDentista, selectedDate]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const getAgendamentoForTime = (timeSlot: string) => {
    return agendamentos.find(agendamento => {
      const agendamentoTime = format(new Date(agendamento.data_agendamento), 'HH:mm');
      return agendamentoTime === timeSlot;
    });
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

  const selectedDentistaInfo = dentistas.find(d => d.id === selectedDentista);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="space-y-2">
          <label className="text-sm font-medium">Dentista</label>
          <Select value={selectedDentista} onValueChange={setSelectedDentista}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione um dentista" />
            </SelectTrigger>
            <SelectContent>
              {dentistas.map((dentista) => (
                <SelectItem key={dentista.id} value={dentista.id}>
                  {dentista.nome} {dentista.especialidade && `- ${dentista.especialidade}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Data</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-end pt-7">
          <Button 
            onClick={() => setIsAgendamentoModalOpen(true)}
            className="bg-gradient-medical"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Agenda do Dentista */}
      {selectedDentistaInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Agenda - {selectedDentistaInfo.nome}
              {selectedDentistaInfo.especialidade && (
                <span className="text-sm text-muted-foreground">
                  ({selectedDentistaInfo.especialidade})
                </span>
              )}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2">Carregando agenda...</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {generateTimeSlots().map((timeSlot) => {
                  const agendamento = getAgendamentoForTime(timeSlot);
                  
                  return (
                    <div
                      key={timeSlot}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors
                        ${agendamento 
                          ? 'bg-accent/50 border-primary/20' 
                          : 'bg-muted/20 hover:bg-muted/40 border-dashed'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono font-medium">{timeSlot}</span>
                      </div>

                      {agendamento ? (
                        <div className="flex-1 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {agendamento.paciente?.nome || 'Paciente não definido'}
                            </div>
                            {agendamento.procedimento && (
                              <div className="text-sm text-muted-foreground">
                                {agendamento.procedimento}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Duração: {agendamento.duracao_minutos} min
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(agendamento.status)}>
                              {agendamento.status}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 text-muted-foreground">
                          Horário disponível
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

export default AgendaPorDentista;