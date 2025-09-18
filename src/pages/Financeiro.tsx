import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreditCard, Plus, DollarSign, FileText, Mail, Download, Edit, Trash2, FileCheck, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ContratoModal } from "@/components/ContratoModal";
import { AcompanhamentoParcelas } from "@/components/AcompanhamentoParcelas";
import { cn } from "@/lib/utils";

interface Paciente {
  id: string;
  nome: string;
  email?: string;
}

interface Orcamento {
  id: string;
  numero_orcamento: string;
  valor_total: number;
  status: string;
  created_at: string;
}

interface PlanosPagamento {
  id: string;
  paciente_id: string;
  paciente?: {
    nome: string;
    email?: string;
  };
  valor_total: number;
  valor_entrada?: number;
  valor_parcela: number;
  forma_pagamento_entrada?: string;
  forma_pagamento_parcelas: string;
  numero_parcelas: number;
  data_vencimento_primeira_parcela?: string;
  status: string;
  observacoes?: string;
  created_at: string;
}

const Financeiro = () => {
  const { user } = useAuth();
  const [planosPagamento, setPlanosPagamento] = useState<PlanosPagamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxaJurosCartao, setTaxaJurosCartao] = useState<number>(2.5);
  const [taxaJurosBoleto, setTaxaJurosBoleto] = useState<number>(1.5);
  const [contratoModalOpen, setContratoModalOpen] = useState(false);
  const [selectedPlanoId, setSelectedPlanoId] = useState<string | null>(null);
  const [acompanhamentoParcelasOpen, setAcompanhamentoParcelasOpen] = useState(false);
  const [selectedPlanoParaAcompanhamento, setSelectedPlanoParaAcompanhamento] = useState<string | null>(null);

  const statusPlano = [
    { value: 'ativo', label: 'Ativo', color: 'bg-green-100 text-green-800' },
    { value: 'concluido', label: 'Concluído', color: 'bg-blue-100 text-blue-800' },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ];

  const fetchPacientes = async () => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('id, nome, email')
      .eq('user_id', user?.id)
      .order('nome');
    
    if (error) {
      console.error('Erro ao carregar pacientes:', error);
      return;
    }
    setPacientes(data || []);
  };

  const fetchPlanosPagamento = async () => {
    const { data, error } = await supabase
      .from('planos_pagamento')
      .select('*, paciente_id')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao carregar planos de pagamento:', error);
      toast.error('Erro ao carregar planos de pagamento');
      return;
    }

    // Buscar dados dos pacientes separadamente
    if (data && data.length > 0) {
      const pacienteIds = data.map(plano => plano.paciente_id);
      const { data: pacientesData } = await supabase
        .from('pacientes')
        .select('id, nome, email')
        .in('id', pacienteIds);

      const planosComPacientes = data.map(plano => ({
        ...plano,
        paciente: pacientesData?.find(p => p.id === plano.paciente_id)
      }));

      setPlanosPagamento(planosComPacientes);
    } else {
      setPlanosPagamento([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPacientes();
      fetchPlanosPagamento();
      fetchTaxaJuros();
      setLoading(false);
    }
  }, [user]);

  const fetchTaxaJuros = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_settings')
      .select('taxa_juros_cartao, taxa_juros_boleto')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setTaxaJurosCartao((data as any).taxa_juros_cartao || 2.5);
      setTaxaJurosBoleto((data as any).taxa_juros_boleto || 1.5);
    }
  };

  const calculateParcelaDisplay = (plano: PlanosPagamento) => {
    return plano.valor_parcela;
  };

  const calculateParcelaDisplayOLD = (plano: PlanosPagamento) => {
    const valorTotal = plano.valor_total;
    const valorEntrada = plano.valor_entrada || 0;
    const numeroParcelas = plano.numero_parcelas || 1;
    
    const valorRestante = valorTotal - valorEntrada;
    let valorParcela = valorRestante / numeroParcelas;
    
    // Aplicar juros se for cartão e acima de 1x
    if (plano.forma_pagamento_parcelas === 'cartao' && numeroParcelas > 1) {
      const taxaJurosMensal = taxaJurosCartao / 100;
      const fatorJuros = Math.pow(1 + taxaJurosMensal, numeroParcelas);
      valorParcela = valorRestante * (taxaJurosMensal * fatorJuros) / (fatorJuros - 1);
    }
    
    // Aplicar juros se for boleto e acima de 1x
    if (plano.forma_pagamento_parcelas === 'boleto' && numeroParcelas > 1) {
      const taxaJurosMensal = taxaJurosBoleto / 100;
      const fatorJuros = Math.pow(1 + taxaJurosMensal, numeroParcelas);
      valorParcela = valorRestante * (taxaJurosMensal * fatorJuros) / (fatorJuros - 1);
    }
    
    return valorParcela;
  };

  const handleGerarBoletos = async (planoId: string) => {
    try {
      // Aqui será implementada a integração com Asaas
      toast.success('Boletos enviados para geração!');
    } catch (error) {
      console.error('Erro ao gerar boletos:', error);
      toast.error('Erro ao gerar boletos');
    }
  };

  const handleExcluirPlano = async (planoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano de pagamento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('planos_pagamento')
        .delete()
        .eq('id', planoId);

      if (error) throw error;

      toast.success('Plano de pagamento excluído com sucesso!');
      fetchPlanosPagamento();
    } catch (error) {
      console.error('Erro ao excluir plano de pagamento:', error);
      toast.error('Erro ao excluir plano de pagamento');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusPlano.find(s => s.value === status);
    return (
      <Badge className={statusInfo?.color}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-medical rounded-lg flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie planos de pagamento e boletos</p>
        </div>
      </div>

      <Tabs defaultValue="planos" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="planos">Financeiro</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="planos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Pagamento</CardTitle>
              <CardDescription>Gerencie os planos de pagamento dos tratamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Parcelas</TableHead>
                    <TableHead>Forma Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planosPagamento.length > 0 ? (
                    planosPagamento.map(plano => (
                      <TableRow key={plano.id}>
                        <TableCell className="font-medium">
                          {plano.paciente?.nome}
                        </TableCell>
                        <TableCell>
                          R$ {plano.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {plano.valor_entrada 
                            ? `R$ ${plano.valor_entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : 'Sem entrada'
                          }
                        </TableCell>
                        <TableCell>
                          {plano.numero_parcelas || 1}x de R$ {calculateParcelaDisplay(plano).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {plano.forma_pagamento_parcelas === 'boleto' ? 'Boleto' : 'Cartão'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(plano.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {plano.forma_pagamento_parcelas === 'boleto' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGerarBoletos(plano.id)}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Gerar Boletos
                              </Button>
                            )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPlanoParaAcompanhamento(plano.id);
                                  setAcompanhamentoParcelasOpen(true);
                                }}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Parcelas
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPlanoId(plano.id);
                                  setContratoModalOpen(true);
                                }}
                              >
                                <FileCheck className="w-4 h-4 mr-1" />
                                Contrato
                              </Button>
                             <Button
                               variant="outline"
                               size="icon"
                               onClick={() => handleExcluirPlano(plano.id)}
                               className="text-destructive hover:text-destructive h-8 w-8"
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum plano de pagamento encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ContratoModal
        open={contratoModalOpen}
        onOpenChange={setContratoModalOpen}
        planoId={selectedPlanoId || undefined}
      />

      {acompanhamentoParcelasOpen && selectedPlanoParaAcompanhamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background max-w-6xl w-full max-h-[90vh] overflow-auto rounded-lg">
            <AcompanhamentoParcelas
              planoId={selectedPlanoParaAcompanhamento}
              onClose={() => {
                setAcompanhamentoParcelasOpen(false);
                setSelectedPlanoParaAcompanhamento(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Financeiro;