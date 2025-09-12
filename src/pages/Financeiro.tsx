import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Plus, Calendar as CalendarIcon, DollarSign, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Paciente {
  id: string;
  nome: string;
}

interface Pagamento {
  id: string;
  paciente_id: string;
  paciente?: { nome: string };
  valor: number;
  forma_pagamento: string;
  status: string;
  data_vencimento?: string;
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
}

const Financeiro = () => {
  const { user } = useAuth();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState<Pagamento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    paciente_id: '',
    valor: '',
    forma_pagamento: '',
    status: 'pendente',
    data_vencimento: undefined as Date | undefined,
    data_pagamento: undefined as Date | undefined,
    observacoes: ''
  });

  const formasPagamento = [
    'Dinheiro',
    'Cartão de Crédito',
    'Cartão de Débito',
    'PIX',
    'Transferência Bancária',
    'Boleto',
    'Cheque'
  ];

  const statusPagamento = [
    { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'pago', label: 'Pago', color: 'bg-green-100 text-green-800' },
    { value: 'atrasado', label: 'Atrasado', color: 'bg-red-100 text-red-800' },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
  ];

  const fetchPacientes = async () => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('id, nome')
      .eq('user_id', user?.id)
      .order('nome');

    if (error) {
      console.error('Erro ao carregar pacientes:', error);
      return;
    }

    setPacientes(data || []);
  };

  const fetchPagamentos = async () => {
    const { data, error } = await supabase
      .from('pagamentos')
      .select(`
        *,
        paciente:pacientes(nome)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar pagamentos:', error);
      toast.error('Erro ao carregar pagamentos');
      return;
    }

    setPagamentos(data || []);
  };

  useEffect(() => {
    if (user) {
      fetchPacientes();
      fetchPagamentos();
      setLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paciente_id || !formData.valor || !formData.forma_pagamento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const pagamentoData = {
      ...formData,
      user_id: user?.id,
      valor: parseFloat(formData.valor),
      data_vencimento: formData.data_vencimento?.toISOString().split('T')[0],
      data_pagamento: formData.data_pagamento?.toISOString(),
    };

    try {
      if (editingPagamento) {
        const { error } = await supabase
          .from('pagamentos')
          .update(pagamentoData)
          .eq('id', editingPagamento.id);

        if (error) throw error;
        toast.success('Pagamento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('pagamentos')
          .insert([pagamentoData]);

        if (error) throw error;
        toast.success('Pagamento registrado com sucesso!');
      }

      setIsDialogOpen(false);
      setEditingPagamento(null);
      resetForm();
      fetchPagamentos();
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error);
      toast.error('Erro ao salvar pagamento');
    }
  };

  const resetForm = () => {
    setFormData({
      paciente_id: '',
      valor: '',
      forma_pagamento: '',
      status: 'pendente',
      data_vencimento: undefined,
      data_pagamento: undefined,
      observacoes: ''
    });
  };

  const handleEdit = (pagamento: Pagamento) => {
    setEditingPagamento(pagamento);
    setFormData({
      paciente_id: pagamento.paciente_id,
      valor: pagamento.valor.toString(),
      forma_pagamento: pagamento.forma_pagamento,
      status: pagamento.status,
      data_vencimento: pagamento.data_vencimento ? new Date(pagamento.data_vencimento) : undefined,
      data_pagamento: pagamento.data_pagamento ? new Date(pagamento.data_pagamento) : undefined,
      observacoes: pagamento.observacoes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) return;

    try {
      const { error } = await supabase
        .from('pagamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Pagamento excluído com sucesso!');
      fetchPagamentos();
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      toast.error('Erro ao excluir pagamento');
    }
  };

  const filteredPagamentos = pagamentos.filter(pagamento =>
    pagamento.paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pagamento.forma_pagamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusInfo = statusPagamento.find(s => s.value === status);
    return (
      <Badge className={statusInfo?.color}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const totalPendente = pagamentos
    .filter(p => p.status === 'pendente')
    .reduce((sum, p) => sum + p.valor, 0);

  const totalPago = pagamentos
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + p.valor, 0);

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
          <p className="text-muted-foreground">Gerencie pagamentos e controle financeiro</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Geral</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {(totalPendente + totalPago).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pagamentos" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          </TabsList>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  resetForm();
                  setEditingPagamento(null);
                }}
                className="bg-gradient-medical hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPagamento ? 'Editar Pagamento' : 'Novo Pagamento'}
                </DialogTitle>
                <DialogDescription>
                  {editingPagamento ? 'Atualize as informações do pagamento' : 'Registre um novo pagamento'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paciente_id">Paciente *</Label>
                    <Select 
                      value={formData.paciente_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paciente_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {pacientes.map((paciente) => (
                          <SelectItem key={paciente.id} value={paciente.id}>
                            {paciente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.valor}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                    <Select 
                      value={formData.forma_pagamento} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPagamento.map((forma) => (
                          <SelectItem key={forma} value={forma}>
                            {forma}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusPagamento.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Vencimento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.data_vencimento && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.data_vencimento ? format(formData.data_vencimento, "dd/MM/yyyy") : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.data_vencimento}
                          onSelect={(date) => setFormData(prev => ({ ...prev, data_vencimento: date }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Pagamento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.data_pagamento && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.data_pagamento ? format(formData.data_pagamento, "dd/MM/yyyy") : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.data_pagamento}
                          onSelect={(date) => setFormData(prev => ({ ...prev, data_pagamento: date }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input
                    id="observacoes"
                    placeholder="Observações sobre o pagamento"
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-medical hover:opacity-90">
                    {editingPagamento ? 'Atualizar' : 'Registrar'} Pagamento
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="pagamentos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Pagamentos</CardTitle>
                  <CardDescription>Gerencie todos os pagamentos da clínica</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar pagamentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPagamentos.length > 0 ? (
                    filteredPagamentos.map((pagamento) => (
                      <TableRow key={pagamento.id}>
                        <TableCell className="font-medium">
                          {pagamento.paciente?.nome}
                        </TableCell>
                        <TableCell>
                          R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{pagamento.forma_pagamento}</TableCell>
                        <TableCell>{getStatusBadge(pagamento.status)}</TableCell>
                        <TableCell>
                          {pagamento.data_vencimento ? format(new Date(pagamento.data_vencimento), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {pagamento.data_pagamento ? format(new Date(pagamento.data_pagamento), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(pagamento)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(pagamento.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Nenhum pagamento encontrado com o termo pesquisado' : 'Nenhum pagamento registrado ainda'}
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