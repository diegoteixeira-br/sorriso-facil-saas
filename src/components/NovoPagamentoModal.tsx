import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Paciente {
  id: string;
  nome: string;
}

interface NovoPagamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NovoPagamentoModal = ({ open, onOpenChange }: NovoPagamentoModalProps) => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [openPacienteCombobox, setOpenPacienteCombobox] = useState(false);
  const [searchPaciente, setSearchPaciente] = useState("");
  
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
    { value: 'pendente', label: 'Pendente' },
    { value: 'pago', label: 'Pago' },
    { value: 'atrasado', label: 'Atrasado' },
    { value: 'cancelado', label: 'Cancelado' }
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

  useEffect(() => {
    if (user && open) {
      fetchPacientes();
    }
  }, [user, open]);

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
      const { error } = await supabase
        .from('pagamentos')
        .insert([pagamentoData]);

      if (error) throw error;

      toast.success('Pagamento registrado com sucesso!');
      onOpenChange(false);
      resetForm();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Pagamento</DialogTitle>
          <DialogDescription>
            Registre um novo pagamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paciente_id">Paciente *</Label>
              <Popover open={openPacienteCombobox} onOpenChange={setOpenPacienteCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPacienteCombobox}
                    className="w-full justify-between"
                  >
                    {formData.paciente_id 
                      ? pacientes.find(p => p.id === formData.paciente_id)?.nome || "Paciente não encontrado"
                      : "Buscar paciente..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Digite o nome do paciente..." 
                      value={searchPaciente}
                      onValueChange={setSearchPaciente}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {pacientes
                          .filter(paciente => 
                            paciente.nome.toLowerCase().includes(searchPaciente.toLowerCase())
                          )
                          .map(paciente => (
                            <CommandItem
                              key={paciente.id}
                              value={paciente.nome}
                              onSelect={() => {
                                setFormData(prev => ({ ...prev, paciente_id: paciente.id }));
                                setOpenPacienteCombobox(false);
                                setSearchPaciente("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.paciente_id === paciente.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {paciente.nome}
                            </CommandItem>
                          ))
                        }
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-medical hover:opacity-90">
              Registrar Pagamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};