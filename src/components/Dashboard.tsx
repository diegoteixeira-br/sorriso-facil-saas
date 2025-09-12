import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NovoClienteModal } from "@/components/NovoClienteModal";
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
  const { subscribed, subscriptionTier, subscriptionEnd, checkSubscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
          <Button variant="outline">
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
                      : 'Assine um plano para continuar usando o Sorriso Fácil'
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
          value="1,234"
          change="+12% este mês"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Consultas Hoje"
          value="8"
          change="6 concluídas"
          icon={Calendar}
          trend="neutral"
        />
        <StatCard
          title="Receita Mensal"
          value="R$ 24.500"
          change="+8% vs mês anterior"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Taxa de Presença"
          value="92%"
          change="+2% vs semana passada"
          icon={CheckCircle}
          trend="up"
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
              {[
                { time: "09:00", patient: "Maria Silva", procedure: "Limpeza", status: "Confirmado" },
                { time: "10:30", patient: "João Santos", procedure: "Tratamento de Canal", status: "Pendente" },
                { time: "14:00", patient: "Ana Costa", procedure: "Restauração", status: "Confirmado" },
                { time: "15:30", patient: "Pedro Lima", procedure: "Consulta", status: "Confirmado" },
              ].map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium bg-primary text-primary-foreground px-2 py-1 rounded">
                      {appointment.time}
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{appointment.patient}</p>
                      <p className="text-sm text-muted-foreground">{appointment.procedure}</p>
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    appointment.status === "Confirmado" 
                      ? "bg-success/10 text-success" 
                      : "bg-primary/10 text-primary"
                  }`}>
                    {appointment.status}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
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
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Nova Consulta
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="w-4 h-4 mr-2" />
              Registrar Pagamento
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ver Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Adicionais */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Procedimentos Mais Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Limpeza", count: 45, percentage: 85 },
                { name: "Restauração", count: 32, percentage: 60 },
                { name: "Tratamento de Canal", count: 18, percentage: 35 },
                { name: "Extração", count: 12, percentage: 25 },
              ].map((procedure, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-card-foreground">{procedure.name}</span>
                    <span className="text-muted-foreground">{procedure.count}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-medical h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${procedure.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Faturamento Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground mb-2">R$ 6.850</div>
            <p className="text-sm text-muted-foreground mb-4">Meta: R$ 8.000</p>
            <div className="w-full bg-muted rounded-full h-3">
              <div className="bg-gradient-success h-3 rounded-full" style={{ width: '85.6%' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">85.6% da meta atingida</p>
          </CardContent>
        </Card>
      </div>

      <NovoClienteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}