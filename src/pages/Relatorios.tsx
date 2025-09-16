import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  TrendingUp,
  BarChart3,
  DollarSign,
  Calendar,
  Users,
  FileText,
  Download,
  Filter
} from "lucide-react";

export default function Relatorios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    totalPendente: 0,
    totalPago: 0,
    totalGeral: 0
  });

  const [dashboardStats, setDashboardStats] = useState({
    receitaTotal: 0,
    consultasRealizadas: 0,
    novosPacientes: 0,
    ticketMedio: 0,
    faturamentoSemanal: 0,
    metaSemanal: 8000,
    taxaRetorno: 0
  });

  const [procedimentosMaisRealizados, setProcedimentosMaisRealizados] = useState<any[]>([]);
  const [faturamentoPorPeriodo, setFaturamentoPorPeriodo] = useState<any[]>([]);
  const [procedimentosPorDentista, setProcedimentosPorDentista] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAllReportsData();
    }
  }, [user]);

  const fetchAllReportsData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Buscar dados financeiros básicos
      const { data: pagamentos } = await supabase
        .from('pagamentos')
        .select('valor, status, data_pagamento, created_at')
        .eq('user_id', user.id);

      if (pagamentos) {
        const totalPendente = pagamentos.filter(p => p.status === 'pendente').reduce((sum, p) => sum + Number(p.valor), 0);
        const totalPago = pagamentos.filter(p => p.status === 'pago').reduce((sum, p) => sum + Number(p.valor), 0);
        
        setFinancialData({
          totalPendente,
          totalPago,
          totalGeral: totalPendente + totalPago
        });

        // Calcular faturamento semanal (últimos 7 dias)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const faturamentoSemanal = pagamentos
          .filter(p => p.status === 'pago' && new Date(p.data_pagamento || p.created_at) >= sevenDaysAgo)
          .reduce((sum, p) => sum + Number(p.valor), 0);

        // Calcular ticket médio
        const pagamentosValidos = pagamentos.filter(p => p.status === 'pago');
        const ticketMedio = pagamentosValidos.length > 0 ? totalPago / pagamentosValidos.length : 0;

        setDashboardStats(prev => ({
          ...prev,
          receitaTotal: totalPago,
          ticketMedio,
          faturamentoSemanal
        }));
      }

      // Buscar dados de consultas e pacientes
      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('id, status, procedimento, created_at, data_agendamento, dentista_id, paciente_id')
        .eq('user_id', user.id);

      const { data: pacientes } = await supabase
        .from('pacientes')
        .select('id, created_at')
        .eq('user_id', user.id);

      const { data: dentistas } = await supabase
        .from('dentistas')
        .select('id, nome')
        .eq('user_id', user.id);

      if (agendamentos && pacientes) {
        const consultasRealizadas = agendamentos.filter(a => a.status === 'realizado').length;
        
        // Novos pacientes no mês atual
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const novosPacientes = pacientes.filter(p => {
          const created = new Date(p.created_at);
          return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
        }).length;

        // Calcular taxa de retorno (pacientes com mais de 1 consulta)
        const pacientesComConsultas = new Map();
        agendamentos.forEach(a => {
          const count = pacientesComConsultas.get(a.paciente_id) || 0;
          pacientesComConsultas.set(a.paciente_id, count + 1);
        });
        
        const pacientesQueRetornaram = Array.from(pacientesComConsultas.values()).filter(count => count > 1).length;
        const taxaRetorno = pacientes.length > 0 ? Math.round((pacientesQueRetornaram / pacientes.length) * 100) : 0;

        setDashboardStats(prev => ({
          ...prev,
          consultasRealizadas,
          novosPacientes,
          taxaRetorno
        }));

        // Procedimentos mais realizados
        const procedimentosCount = new Map();
        agendamentos.filter(a => a.procedimento && a.status === 'realizado').forEach(a => {
          const proc = a.procedimento;
          procedimentosCount.set(proc, (procedimentosCount.get(proc) || 0) + 1);
        });

        const maxCount = Math.max(...Array.from(procedimentosCount.values()), 1);
        const procedimentosArray = Array.from(procedimentosCount.entries())
          .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / maxCount) * 100)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setProcedimentosMaisRealizados(procedimentosArray);

        // Procedimentos por dentista
        if (dentistas) {
          const procedimentosPorDentista = dentistas.map(dentista => {
            const procedimentosDentista = agendamentos.filter(a => 
              a.dentista_id === dentista.id && a.status === 'realizado'
            );
            
            const revenue = procedimentosDentista.length * 200; // Estimativa
            
            return {
              name: dentista.nome,
              procedures: procedimentosDentista.length,
              revenue: `R$ ${revenue.toLocaleString('pt-BR')}`
            };
          }).sort((a, b) => b.procedures - a.procedures);

          setProcedimentosPorDentista(procedimentosPorDentista);
        }
      }

      // Faturamento por período (últimos 6 meses)
      if (pagamentos) {
        const monthlyData = [];
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = date.getMonth();
          const year = date.getFullYear();
          
          const monthlyRevenue = pagamentos
            .filter(p => {
              const paymentDate = new Date(p.data_pagamento || p.created_at);
              return p.status === 'pago' && 
                     paymentDate.getMonth() === month && 
                     paymentDate.getFullYear() === year;
            })
            .reduce((sum, p) => sum + Number(p.valor), 0);

          const prevMonthRevenue = i === 5 ? monthlyRevenue : monthlyData[monthlyData.length - 1]?.amount || 0;
          const change = prevMonthRevenue > 0 ? 
            Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : 0;

          monthlyData.push({
            period: months[month],
            amount: `R$ ${monthlyRevenue.toLocaleString('pt-BR')}`,
            change: `${change >= 0 ? '+' : ''}${change}%`
          });
        }

        setFaturamentoPorPeriodo(monthlyData.slice(-4)); // Últimos 4 meses
      }

    } catch (error) {
      console.error('Erro ao buscar dados dos relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funções para download de relatórios
  const generateCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const key = header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const value = row[key] || '';
        return `"${value}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadRelatorioMensal = async () => {
    if (!user) return;

    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const monthStr = currentMonth.toString().padStart(2, '0');

      const { data: pagamentos } = await supabase
        .from('pagamentos')
        .select('valor, status, forma_pagamento, created_at')
        .eq('user_id', user.id)
        .gte('created_at', `${currentYear}-${monthStr}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', `${currentYear}-${monthStr}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      const relatorioData = [{
        resumo: 'Financeiro',
        total_pagamentos: pagamentos?.length || 0,
        valor_total: pagamentos?.reduce((sum, p) => sum + Number(p.valor), 0) || 0,
        pagamentos_confirmados: pagamentos?.filter(p => p.status === 'pago').length || 0,
        consultas_realizadas: agendamentos?.filter(a => a.status === 'realizado').length || 0
      }];

      generateCSV(relatorioData, `relatorio_mensal_${monthStr}_${currentYear}`, 
        ['Resumo', 'Total Pagamentos', 'Valor Total', 'Pagamentos Confirmados', 'Consultas Realizadas']);

      toast({
        title: "Relatório gerado!",
        description: "O relatório mensal foi baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório mensal",
        variant: "destructive",
      });
    }
  };

  const downloadPacientesAtivos = async () => {
    if (!user) return;

    try {
      const { data: pacientes } = await supabase
        .from('pacientes')
        .select('nome, email, telefone, data_nascimento, created_at')
        .eq('user_id', user.id);

      if (!pacientes || pacientes.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum paciente encontrado para exportar.",
        });
        return;
      }

      const pacientesData = pacientes.map(p => ({
        nome: p.nome,
        email: p.email || '',
        telefone: p.telefone || '',
        data_nascimento: p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : '',
        data_cadastro: new Date(p.created_at).toLocaleDateString('pt-BR')
      }));

      generateCSV(pacientesData, 'pacientes_ativos', 
        ['Nome', 'Email', 'Telefone', 'Data Nascimento', 'Data Cadastro']);

      toast({
        title: "Relatório gerado!",
        description: `Lista de ${pacientes.length} pacientes exportada com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de pacientes",
        variant: "destructive",
      });
    }
  };

  const downloadFaturamentoAnual = async () => {
    if (!user) return;

    try {
      const currentYear = new Date().getFullYear();
      
      const { data: pagamentos } = await supabase
        .from('pagamentos')
        .select('valor, status, data_pagamento, created_at')
        .eq('user_id', user.id)
        .gte('created_at', `${currentYear}-01-01`)
        .lt('created_at', `${currentYear + 1}-01-01`);

      if (!pagamentos || pagamentos.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum pagamento encontrado para o ano atual.",
        });
        return;
      }

      const meses = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const pagamentosMes = pagamentos.filter(p => {
          const date = new Date(p.data_pagamento || p.created_at);
          return date.getMonth() + 1 === month;
        });

        return {
          mes: new Date(currentYear, i).toLocaleDateString('pt-BR', { month: 'long' }),
          total_pagamentos: pagamentosMes.length,
          valor_total: pagamentosMes.reduce((sum, p) => sum + Number(p.valor), 0),
          valor_confirmado: pagamentosMes.filter(p => p.status === 'pago').reduce((sum, p) => sum + Number(p.valor), 0)
        };
      });

      generateCSV(meses, `faturamento_anual_${currentYear}`, 
        ['Mes', 'Total Pagamentos', 'Valor Total', 'Valor Confirmado']);

      toast({
        title: "Relatório gerado!",
        description: `Faturamento anual de ${currentYear} exportado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de faturamento anual",
        variant: "destructive",
      });
    }
  };

  const downloadProcedimentos = async () => {
    if (!user) return;

    try {
      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select(`
          procedimento,
          status,
          data_agendamento,
          pacientes (nome),
          dentistas (nome)
        `)
        .eq('user_id', user.id)
        .order('data_agendamento', { ascending: false });

      if (!agendamentos || agendamentos.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum procedimento encontrado para exportar.",
        });
        return;
      }

      const procedimentosData = agendamentos.map(a => ({
        procedimento: a.procedimento || 'Não informado',
        paciente: a.pacientes?.nome || 'Não informado',
        dentista: a.dentistas?.nome || 'Não informado',
        status: a.status,
        data: new Date(a.data_agendamento).toLocaleDateString('pt-BR')
      }));

      generateCSV(procedimentosData, 'procedimentos', 
        ['Procedimento', 'Paciente', 'Dentista', 'Status', 'Data']);

      toast({
        title: "Relatório gerado!",
        description: `Lista de ${agendamentos.length} procedimentos exportada com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de procedimentos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise completa da gestão da clínica</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="animate-fade-in hover:shadow-medical transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendente
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {financialData.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagamentos em aberto
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover:shadow-medical transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recebido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {financialData.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover:shadow-medical transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Geral
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {financialData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in hover:shadow-medical transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {loading ? "..." : `R$ ${dashboardStats.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover:shadow-medical transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consultas Realizadas
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {loading ? "..." : dashboardStats.consultasRealizadas}
            </div>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Procedimentos concluídos
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover:shadow-medical transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Pacientes
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {loading ? "..." : dashboardStats.novosPacientes}
            </div>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Neste mês
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover:shadow-medical transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {loading ? "..." : `R$ ${dashboardStats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Por consulta paga
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Procedimentos Mais Realizados */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Procedimentos Mais Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Carregando...</div>
              ) : procedimentosMaisRealizados.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum procedimento encontrado
                </div>
              ) : (
                procedimentosMaisRealizados.map((procedure, index) => (
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
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Faturamento Semanal */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Faturamento Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground mb-2">
              {loading ? "..." : `R$ ${dashboardStats.faturamentoSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Meta: R$ {dashboardStats.metaSemanal.toLocaleString('pt-BR')}
            </p>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-success h-3 rounded-full" 
                style={{ width: `${Math.min((dashboardStats.faturamentoSemanal / dashboardStats.metaSemanal) * 100, 100)}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {loading ? "..." : `${Math.round((dashboardStats.faturamentoSemanal / dashboardStats.metaSemanal) * 100)}% da meta atingida`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Reports Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Faturamento por Período */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Faturamento por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Carregando...</div>
              ) : faturamentoPorPeriodo.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum dado encontrado
                </div>
              ) : (
                faturamentoPorPeriodo.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-card-foreground">{item.period}</p>
                      <p className="text-sm text-muted-foreground">{item.amount}</p>
                    </div>
                    <Badge variant={item.change.startsWith('+') ? 'default' : 'destructive'}>
                      {item.change}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Procedimentos por Dentista */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Procedimentos por Dentista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Carregando...</div>
              ) : procedimentosPorDentista.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum dentista encontrado
                </div>
              ) : (
                procedimentosPorDentista.map((dentist, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-card-foreground">{dentist.name}</p>
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{dentist.procedures} procedimentos</span>
                      <span>{dentist.revenue}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Retorno */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Taxa de Retorno de Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {loading ? "..." : `${dashboardStats.taxaRetorno}%`}
              </div>
              <p className="text-sm text-muted-foreground mb-4">dos pacientes retornaram</p>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-gradient-medical h-3 rounded-full" 
                  style={{ width: `${dashboardStats.taxaRetorno}%` }} 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Meta: 80%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Rápidos */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Relatórios Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={downloadRelatorioMensal}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Relatório Mensal
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={downloadPacientesAtivos}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Pacientes Ativos
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={downloadFaturamentoAnual}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Faturamento Anual
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={downloadProcedimentos}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Procedimentos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}