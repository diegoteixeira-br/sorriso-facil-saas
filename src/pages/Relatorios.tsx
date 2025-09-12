import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
            <div className="text-2xl font-bold text-card-foreground">R$ 98.450</div>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +15% vs mês anterior
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
            <div className="text-2xl font-bold text-card-foreground">287</div>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +8% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover:shadow-medical transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">42</div>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +23% vs mês anterior
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
            <div className="text-2xl font-bold text-card-foreground">R$ 343</div>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +5% vs mês anterior
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

        {/* Faturamento Semanal */}
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

      {/* Additional Reports Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Faturamento por Período */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Faturamento por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { period: "Janeiro", amount: "R$ 15.450", change: "+12%" },
                { period: "Fevereiro", amount: "R$ 18.200", change: "+18%" },
                { period: "Março", amount: "R$ 22.300", change: "+22%" },
                { period: "Abril", amount: "R$ 19.850", change: "-11%" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">{item.period}</p>
                    <p className="text-sm text-muted-foreground">{item.amount}</p>
                  </div>
                  <Badge variant={item.change.startsWith('+') ? 'default' : 'destructive'}>
                    {item.change}
                  </Badge>
                </div>
              ))}
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
              {[
                { name: "Dr. João Silva", procedures: 45, revenue: "R$ 12.500" },
                { name: "Dra. Maria Santos", procedures: 38, revenue: "R$ 9.800" },
                { name: "Dr. Pedro Costa", procedures: 32, revenue: "R$ 8.200" },
              ].map((dentist, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-card-foreground">{dentist.name}</p>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{dentist.procedures} procedimentos</span>
                    <span>{dentist.revenue}</span>
                  </div>
                </div>
              ))}
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
              <div className="text-4xl font-bold text-primary mb-2">78%</div>
              <p className="text-sm text-muted-foreground mb-4">dos pacientes retornaram</p>
              <div className="w-full bg-muted rounded-full h-3">
                <div className="bg-gradient-medical h-3 rounded-full" style={{ width: '78%' }} />
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
            <Button variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Relatório Mensal
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Pacientes Ativos
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Faturamento Anual
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Procedimentos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}