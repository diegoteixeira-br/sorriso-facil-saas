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
import { CreditCard, Plus, DollarSign, FileText, Mail, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  valor: number;
  valor_total?: number;
  valor_entrada?: number;
  forma_pagamento: string;
  forma_pagamento_entrada?: string;
  numero_parcelas?: number;
  parcela_numero?: number;
  plano_pagamento?: boolean;
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<PlanosPagamento | null>(null);
  const [taxaJurosCartao, setTaxaJurosCartao] = useState<number>(2.5);
  const [taxaJurosBoleto, setTaxaJurosBoleto] = useState<number>(1.5);

  // Form state
  const [formData, setFormData] = useState({
    paciente_id: '',
    orcamento_id: '',
    valor_total: '',
    valor_entrada: '',
    forma_pagamento_entrada: '',
    forma_pagamento_parcelas: 'boleto',
    numero_parcelas: '1',
    observacoes: ''
  });

  const formasPagamento = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Transferência Bancária'];
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

  const fetchOrcamentosPaciente = async (pacienteId: string) => {
    if (!pacienteId) {
      setOrcamentos([]);
      return;
    }

    const { data, error } = await supabase
      .from('orcamentos')
      .select('id, numero_orcamento, valor_total, status, created_at')
      .eq('user_id', user?.id)
      .eq('paciente_id', pacienteId)
      .in('status', ['pendente', 'aprovado'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao carregar orçamentos:', error);
      setOrcamentos([]);
      return;
    }
    setOrcamentos(data || []);
  };

  const fetchPlanosPagamento = async () => {
    const { data, error } = await supabase
      .from('pagamentos')
      .select(`
        *,
        paciente:pacientes(nome, email)
      `)
      .eq('user_id', user?.id)
      .eq('plano_pagamento', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao carregar planos de pagamento:', error);
      toast.error('Erro ao carregar planos de pagamento');
      return;
    }
    setPlanosPagamento(data || []);
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
    const valorTotal = plano.valor_total || plano.valor;
    const valorEntrada = plano.valor_entrada || 0;
    const numeroParcelas = plano.numero_parcelas || 1;
    
    const valorRestante = valorTotal - valorEntrada;
    let valorParcela = valorRestante / numeroParcelas;
    
    // Aplicar juros se for cartão e acima de 1x
    if (plano.forma_pagamento === 'cartao' && numeroParcelas > 1) {
      const taxaTotal = 1 + (taxaJurosCartao * numeroParcelas / 100);
      valorParcela = (valorRestante * taxaTotal) / numeroParcelas;
    }
    
    // Aplicar juros se for boleto e acima de 1x
    if (plano.forma_pagamento === 'boleto' && numeroParcelas > 1) {
      const taxaTotal = 1 + (taxaJurosBoleto * numeroParcelas / 100);
      valorParcela = (valorRestante * taxaTotal) / numeroParcelas;
    }
    
    return valorParcela;
  };

  const calculateParcela = () => {
    const valorTotal = parseFloat(formData.valor_total) || 0;
    const valorEntrada = parseFloat(formData.valor_entrada) || 0;
    const numeroParcelas = parseInt(formData.numero_parcelas) || 1;
    
    const valorRestante = valorTotal - valorEntrada;
    let valorParcela = valorRestante / numeroParcelas;
    
    // Aplicar juros se for cartão e acima de 1x
    if (formData.forma_pagamento_parcelas === 'cartao' && numeroParcelas > 1) {
      const taxaTotal = 1 + (taxaJurosCartao * numeroParcelas / 100);
      valorParcela = (valorRestante * taxaTotal) / numeroParcelas;
    }
    
    // Aplicar juros se for boleto e acima de 1x
    if (formData.forma_pagamento_parcelas === 'boleto' && numeroParcelas > 1) {
      const taxaTotal = 1 + (taxaJurosBoleto * numeroParcelas / 100);
      valorParcela = (valorRestante * taxaTotal) / numeroParcelas;
    }
    
    return valorParcela;
  };

  const getMaxParcelas = () => {
    return formData.forma_pagamento_parcelas === 'boleto' ? 36 : 12;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paciente_id || !formData.orcamento_id || !formData.valor_total || !formData.forma_pagamento_parcelas) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const valorParcela = calculateParcela();
    
    // Primeiro criar o registro principal do plano
    const planoData = {
      user_id: user?.id,
      paciente_id: formData.paciente_id,
      valor: parseFloat(formData.valor_total),
      valor_total: parseFloat(formData.valor_total),
      valor_entrada: formData.valor_entrada ? parseFloat(formData.valor_entrada) : null,
      forma_pagamento: formData.forma_pagamento_parcelas,
      forma_pagamento_entrada: formData.forma_pagamento_entrada || null,
      numero_parcelas: parseInt(formData.numero_parcelas),
      parcela_numero: 0, // Registro principal
      plano_pagamento: true,
      status: 'ativo',
      observacoes: formData.observacoes
    };

    try {
      if (editingPlano) {
        const { error } = await supabase
          .from('pagamentos')
          .update(planoData)
          .eq('id', editingPlano.id);
        
        if (error) throw error;
        toast.success('Plano de pagamento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('pagamentos')
          .insert([planoData]);
        
        if (error) throw error;
        toast.success('Plano de pagamento criado com sucesso!');
      }

      setIsDialogOpen(false);
      setEditingPlano(null);
      resetForm();
      fetchPlanosPagamento();
    } catch (error) {
      console.error('Erro ao salvar plano de pagamento:', error);
      toast.error('Erro ao salvar plano de pagamento');
    }
  };

  const resetForm = () => {
    setFormData({
      paciente_id: '',
      orcamento_id: '',
      valor_total: '',
      valor_entrada: '',
      forma_pagamento_entrada: '',
      forma_pagamento_parcelas: 'boleto',
      numero_parcelas: '1',
      observacoes: ''
    });
    setOrcamentos([]);
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
            <TabsTrigger value="planos">Planos de Pagamento</TabsTrigger>
          </TabsList>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-medical hover:opacity-90"
                onClick={() => {
                  setEditingPlano(null);
                  resetForm();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Plano de Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPlano ? 'Editar Plano de Pagamento' : 'Novo Plano de Pagamento'}
                </DialogTitle>
                <DialogDescription>
                  Configure como o paciente irá pagar pelo tratamento
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="paciente_id">Paciente *</Label>
                     <Select 
                       value={formData.paciente_id} 
                       onValueChange={(value) => {
                         setFormData(prev => ({ 
                           ...prev, 
                           paciente_id: value,
                           orcamento_id: '',
                           valor_total: ''
                         }));
                         fetchOrcamentosPaciente(value);
                       }}
                       required
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Selecione o paciente" />
                       </SelectTrigger>
                       <SelectContent>
                         {pacientes.map(paciente => (
                           <SelectItem key={paciente.id} value={paciente.id}>
                             {paciente.nome}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="orcamento_id">Orçamento *</Label>
                     <Select 
                       value={formData.orcamento_id} 
                       onValueChange={(value) => {
                         const orcamentoSelecionado = orcamentos.find(o => o.id === value);
                         setFormData(prev => ({ 
                           ...prev, 
                           orcamento_id: value,
                           valor_total: orcamentoSelecionado ? orcamentoSelecionado.valor_total.toString() : ''
                         }));
                       }}
                       required
                       disabled={!formData.paciente_id}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder={formData.paciente_id ? "Selecione o orçamento" : "Selecione primeiro o paciente"} />
                       </SelectTrigger>
                       <SelectContent>
                         {orcamentos.map(orcamento => (
                           <SelectItem key={orcamento.id} value={orcamento.id}>
                             {orcamento.numero_orcamento} - R$ {orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     {formData.paciente_id && orcamentos.length === 0 && (
                       <p className="text-sm text-muted-foreground">Nenhum orçamento encontrado para este paciente</p>
                     )}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_entrada">Valor da Entrada (Opcional)</Label>
                    <Input 
                      id="valor_entrada" 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      value={formData.valor_entrada}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_entrada: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="forma_pagamento_entrada">Forma de Pagamento da Entrada</Label>
                    <Select 
                      value={formData.forma_pagamento_entrada} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento_entrada: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPagamento.map(forma => (
                          <SelectItem key={forma} value={forma}>
                            {forma}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="forma_pagamento_parcelas">Forma de Pagamento das Parcelas *</Label>
                    <Select 
                      value={formData.forma_pagamento_parcelas} 
                      onValueChange={(value) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          forma_pagamento_parcelas: value,
                          // Reset parcelas quando muda forma de pagamento
                          numero_parcelas: '1'
                        }));
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boleto">Boleto Bancário</SelectItem>
                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero_parcelas">Número de Parcelas *</Label>
                    <Select 
                      value={formData.numero_parcelas} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, numero_parcelas: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: getMaxParcelas() }, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.forma_pagamento_parcelas === 'boleto' 
                        ? 'Boleto bancário: 1x sem juros, acima com juros' 
                        : 'Cartão de crédito: 1x sem juros, acima com juros'
                      }
                    </p>
                  </div>
                </div>

                {formData.valor_total && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Resumo do Plano:</h4>
                    <div className="space-y-1 text-sm">
                      <p>Valor Total: <span className="font-medium">R$ {parseFloat(formData.valor_total || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                      {formData.valor_entrada && (
                        <p>Entrada: <span className="font-medium">R$ {parseFloat(formData.valor_entrada).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                      )}
                      <p>Parcelas: <span className="font-medium">{formData.numero_parcelas}x de R$ {calculateParcela().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                      {formData.forma_pagamento_parcelas === 'cartao' && parseInt(formData.numero_parcelas) > 1 && (
                        <div className="text-amber-600 text-xs space-y-1">
                          <p>⚠️ Parcelas acima de 1x terão juros da operadora ({taxaJurosCartao}% por parcela)</p>
                          <p>Valor total com juros: <span className="font-medium">R$ {(calculateParcela() * parseInt(formData.numero_parcelas) + parseFloat(formData.valor_entrada || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                        </div>
                      )}
                      {formData.forma_pagamento_parcelas === 'boleto' && parseInt(formData.numero_parcelas) > 1 && (
                        <div className="text-amber-600 text-xs space-y-1">
                          <p>⚠️ Parcelas acima de 1x terão juros ({taxaJurosBoleto}% por parcela)</p>
                          <p>Valor total com juros: <span className="font-medium">R$ {(calculateParcela() * parseInt(formData.numero_parcelas) + parseFloat(formData.valor_entrada || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input 
                    id="observacoes" 
                    placeholder="Observações sobre o plano de pagamento" 
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-medical hover:opacity-90">
                    {editingPlano ? 'Atualizar' : 'Criar'} Plano
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                          R$ {(plano.valor_total || plano.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                            {plano.forma_pagamento === 'boleto' ? 'Boleto' : 'Cartão'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(plano.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {plano.forma_pagamento === 'boleto' && (
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
                                // Implementar edição
                              }}
                            >
                              Editar
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
    </div>
  );
};

export default Financeiro;