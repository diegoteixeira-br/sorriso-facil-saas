import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Plus, Clock, User, Phone, Eye, Edit, CheckCircle } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AgendarConsultaModal } from "@/components/AgendarConsultaModal";
import { EditarConsultaModal } from "@/components/EditarConsultaModal";
import { VisualizarPacienteModal } from "@/components/VisualizarPacienteModal";

interface Agendamento {
  id: string;
  data_agendamento: string;
  duracao_minutos: number;
  status: string;
  procedimento: string;
  observacoes?: string;
  paciente?: {
    id: string;
    nome: string;
    telefone?: string;
  };
  dentista?: {
    id: string;
    nome: string;
  };
}

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendario' | 'lista'>('calendario');
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [selectedAgendamentoId, setSelectedAgendamentoId] = useState<string>('');
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  const { user } = useAuth();

  const fetchAgendamentos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          pacientes!inner(id, nome, telefone),
          dentistas(id, nome)
        `)
        .gte('data_agendamento', startOfMonth.toISOString())
        .lte('data_agendamento', endOfMonth.toISOString())
        .order('data_agendamento', { ascending: true });

      if (error) throw error;

      const agendamentosFormatted = data?.map(item => ({
        id: item.id,
        data_agendamento: item.data_agendamento,
        duracao_minutos: item.duracao_minutos,
        status: item.status,
        procedimento: item.procedimento,
        observacoes: item.observacoes,
        paciente: item.pacientes,
        dentista: item.dentistas
      })) || [];

      setAgendamentos(agendamentosFormatted);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, [user, selectedDate]);

  const getDayAgendamentos = (date: Date) => {
    return agendamentos.filter(agendamento => 
      isSameDay(new Date(agendamento.data_agendamento), date)
    );
  };

  const getSelectedDateAgendamentos = () => {
    return getDayAgendamentos(selectedDate);
  };

  const getDaysWithAgendamentos = () => {
    const dates = agendamentos.map(agendamento => new Date(agendamento.data_agendamento));
    return dates;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'agendado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'concluido':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEditarAgendamento = (id: string) => {
    setSelectedAgendamentoId(id);
    setShowEditarModal(true);
  };

  const handleVisualizarPaciente = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setShowVisualizarModal(true);
  };

  const handleConcluirAgendamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'concluido' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Consulta concluída com sucesso!');
      fetchAgendamentos();
    } catch (error) {
      console.error('Erro ao concluir agendamento:', error);
      toast.error('Erro ao concluir consulta');
    }
  };

  const selectedDateAgendamentos = getSelectedDateAgendamentos();
  const totalDia = selectedDateAgendamentos.length;
  const confirmadas = selectedDateAgendamentos.filter(a => a.status === 'confirmado').length;
  const duracaoTotal = selectedDateAgendamentos.reduce((total, a) => total + (a.duracao_minutos || 0), 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-medical rounded-lg flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">Agenda</h1>
            <p className="text-muted-foreground">Bem-vindo de volta!</p>
          </div>
        </div>
        <Button onClick={() => setShowAgendarModal(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nova Consulta
        </Button>
      </div>

      {/* Agenda de Consultas */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Agenda de Consultas</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'calendario' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendario')}
                size="sm"
              >
                Calendário
              </Button>
              <Button
                variant={viewMode === 'lista' ? 'default' : 'outline'}
                onClick={() => setViewMode('lista')}
                size="sm"
              >
                Lista
              </Button>
              <Button onClick={() => setShowAgendarModal(true)} className="ml-2">
                Nova Consulta
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Calendário</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="rounded-md border"
                    modifiers={{
                      hasAppointments: getDaysWithAgendamentos()
                    }}
                    modifiersStyles={{
                      hasAppointments: {
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'white',
                        borderRadius: '6px'
                      }
                    }}
                  />
                  <div className="mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded"></div>
                      Dias com consultas
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appointments List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Consultas para {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Carregando...</div>
                  ) : selectedDateAgendamentos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma consulta agendada para este dia
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDateAgendamentos.map((agendamento) => (
                        <div key={agendamento.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {agendamento.paciente?.nome?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{agendamento.paciente?.nome}</h3>
                                  <Badge className={getStatusColor(agendamento.status)} variant="outline">
                                    {agendamento.status}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground mb-1">{agendamento.procedimento}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    <span>Dentista: {agendamento.dentista?.nome}</span>
                                  </div>
                                  {agendamento.observacoes && (
                                    <span>Observações: {agendamento.observacoes}</span>
                                  )}
                                  {agendamento.paciente?.telefone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-4 h-4" />
                                      <span>Contato: {agendamento.paciente.telefone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-semibold">
                                  {format(new Date(agendamento.data_agendamento), 'HH:mm')}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {agendamento.duracao_minutos}min
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVisualizarPaciente(agendamento.paciente?.id || '')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditarAgendamento(agendamento.id)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {agendamento.status !== 'concluido' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConcluirAgendamento(agendamento.id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total do Dia</p>
                <p className="text-2xl font-bold">{totalDia}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmadas</p>
                <p className="text-2xl font-bold">{confirmadas}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Duração Total</p>
                <p className="text-2xl font-bold">{duracaoTotal}min</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AgendarConsultaModal
        open={showAgendarModal}
        onOpenChange={setShowAgendarModal}
        onSuccess={fetchAgendamentos}
      />

      <EditarConsultaModal
        open={showEditarModal}
        onOpenChange={setShowEditarModal}
        agendamentoId={selectedAgendamentoId}
        onSuccess={fetchAgendamentos}
      />

      <VisualizarPacienteModal
        open={showVisualizarModal}
        onOpenChange={setShowVisualizarModal}
        pacienteId={selectedPacienteId}
      />
    </div>
  );
};

export default Agenda;