import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NovoClienteModal } from "@/components/NovoClienteModal";
import { AgendarConsultaModal } from "@/components/AgendarConsultaModal";
import { NovoPagamentoModal } from "@/components/NovoPagamentoModal";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  ArrowUpRight,
  CreditCard,
  Crown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, change, icon: Icon, trend = "neutral" }: StatCardProps) {
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  
  return (
    <Card className="animate-fade-in hover:shadow-medical transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground">{value}</div>
        {change && (
          <p className={`text-xs ${trendColor} flex items-center gap-1 mt-1`}>
            <TrendingUp className="h-3 w-3" />
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { subscribed, subscriptionTier, subscriptionEnd, checkSubscription, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [isPagamentoModalOpen, setIsPagamentoModalOpen] = useState(false);
  
  // Estados para dados reais
  const [stats, setStats] = useState({
    pacientesAtivos: 0,
    consultasHoje: 0,
    receitaMensal: 0,
    taxaPresenca: 0
  });
  const [proximasConsultas, setProximasConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Buscar dados reais do banco
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // Buscar número de pacientes ativos
      const { data: pacientes } = await supabase
        .from('pacientes')
        .select('id')
        .eq('user_id', user.id);

      // Buscar consultas de hoje
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const { data: consultasHoje } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('user_id', user.id)
        .gte('data_agendamento', `${todayStr}T00:00:00`)
        .lt('data_agendamento', `${todayStr}T23:59:59`);

      // Buscar receita mensal
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      const { data: pagamentosRecebidos } = await supabase
        .from('pagamentos')
        .select('valor')
        .eq('user_id', user.id)
        .eq('status', 'pago')
        .gte('data_pagamento', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('data_pagamento', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      // Calcular taxa de presença
      const { data: consultasRealizadas } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'realizado');

      const { data: consultasTotal } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('user_id', user.id)
        .neq('status', 'cancelado');

      // Buscar próximas consultas
      const { data: proximasConsultasData } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data_agendamento,
          status,
          procedimento,
          pacientes (nome)
        `)
        .eq('user_id', user.id)
        .gte('data_agendamento', new Date().toISOString())
        .order('data_agendamento', { ascending: true })
        .limit(4);

      const receita = pagamentosRecebidos?.reduce((total, pag) => total + Number(pag.valor), 0) || 0;
      const taxaPresenca = consultasTotal?.length 
        ? Math.round((consultasRealizadas?.length || 0) / consultasTotal.length * 100)
        : 0;

      setStats({
        pacientesAtivos: pacientes?.length || 0,
        consultasHoje: consultasHoje?.length || 0,
        receitaMensal: receita,
        taxaPresenca
      });

      setProximasConsultas(proximasConsultasData || []);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o portal de assinatura",
        variant: "destructive",
      });
    }
  };

  const getSubscriptionStatus = () => {
    if (!subscribed) {
      if (subscriptionEnd) {
        const endDate = new Date(subscriptionEnd);
        const now = new Date();
        if (endDate > now) {
          return { status: 'trial', color: 'bg-primary/10 text-primary', text: 'Período de Trial' };
        }
      }
      return { status: 'expired', color: 'bg-destructive/10 text-destructive', text: 'Assinatura Expirada' };
    }
    
    return { 
      status: 'active', 
      color: 'bg-success/10 text-success', 
      text: `Plano ${subscriptionTier === 'basic' ? 'Básico' : subscriptionTier === 'premium' ? 'Premium' : 'Enterprise'} Ativo` 
    };
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">Dashboard</h1>
          <p className="text-muted-foreground capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={subscriptionStatus.color}>
            {subscriptionStatus.text}
          </Badge>
          <Button onClick={() => setIsModalOpen(true)} className="bg-gradient-medical shadow-medical">
            <Plus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
          <Button onClick={() => setIsAgendamentoModalOpen(true)} variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Consulta
          </Button>
        </div>
      </div>

      {/* Subscription Alert */}
      {!subscribed && (
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    {subscriptionStatus.status === 'trial' ? 'Aproveite seu período de trial!' : 'Assinatura necessária'}
                  </h3>
                  <p className="text-muted-foreground">
                    {subscriptionStatus.status === 'trial' 
                      ? `Seu trial expira em ${subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString('pt-BR') : 'breve'}`
                      : 'Assine um plano para continuar usando o sistema'
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={checkSubscription}
                >
                  Atualizar Status
                </Button>
                <Button 
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="bg-medical-600 hover:bg-medical-700"
                >
                  Ver Planos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Management */}
      {subscribed && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-medical-600" />
                <div>
                  <h3 className="font-semibold">Gerenciar Assinatura</h3>
                  <p className="text-muted-foreground">
                    Altere seu plano, método de pagamento ou cancele sua assinatura
                  </p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={handleManageSubscription}
              >
                Gerenciar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pacientes Ativos"
          value={loading ? "..." : stats.pacientesAtivos.toString()}
          change={`${stats.pacientesAtivos} cadastrados`}
          icon={Users}
          trend="neutral"
        />
        <StatCard
          title="Consultas Hoje"
          value={loading ? "..." : stats.consultasHoje.toString()}
          change={`${stats.consultasHoje} agendadas`}
          icon={Calendar}
          trend="neutral"
        />
        <StatCard
          title="Receita Mensal"
          value={loading ? "..." : `R$ ${stats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change="Pagamentos recebidos"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Taxa de Presença"
          value={loading ? "..." : `${stats.taxaPresenca}%`}
          change="Consultas realizadas"
          icon={CheckCircle}
          trend={stats.taxaPresenca >= 80 ? "up" : "neutral"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Próximas Consultas */}
        <Card className="lg:col-span-2 animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Próximas Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : proximasConsultas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma consulta agendada para hoje
                </div>
              ) : (
                proximasConsultas.map((appointment) => {
                  const dataAgendamento = new Date(appointment.data_agendamento);
                  const time = dataAgendamento.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  
                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium bg-primary text-primary-foreground px-2 py-1 rounded">
                          {time}
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">
                            {appointment.pacientes?.nome || 'Paciente não informado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.procedimento || 'Consulta'}
                          </p>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        appointment.status === "confirmado" 
                          ? "bg-success/10 text-success" 
                          : "bg-primary/10 text-primary"
                      }`}>
                        {appointment.status === "confirmado" ? "Confirmado" : "Agendado"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/agenda')}
            >
              Ver Agenda Completa
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Cadastrar Paciente
            </Button>
            <Button onClick={() => setIsAgendamentoModalOpen(true)} variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Nova Consulta
            </Button>
            <Button onClick={() => setIsPagamentoModalOpen(true)} variant="outline" className="w-full justify-start">
              <DollarSign className="w-4 h-4 mr-2" />
              Registrar Pagamento
            </Button>
            <Button onClick={() => navigate('/relatorios')} variant="outline" className="w-full justify-start">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ver Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>


      <NovoClienteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
      
      <AgendarConsultaModal
        open={isAgendamentoModalOpen}
        onOpenChange={setIsAgendamentoModalOpen}
      />
      
      <NovoPagamentoModal
        open={isPagamentoModalOpen}
        onOpenChange={setIsPagamentoModalOpen}
      />
    </div>
  );
}