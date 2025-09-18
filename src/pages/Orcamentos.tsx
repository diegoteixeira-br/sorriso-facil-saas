import { useState, useEffect, useRef } from "react";
import { FileText, Plus, Trash2, Save, FileCheck, Check, ChevronsUpDown, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Odontogram, type OdontogramRef } from "@/components/Odontogram";
import { ContratoModal } from "@/components/ContratoModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Procedimento {
  id: string;
  nome: string;
  preco_base: number;
  categoria: string | null;
}

interface Paciente {
  id: string;
  nome: string;
}

interface OrcamentoItem {
  id: string;
  procedimento_id: string;
  procedimento_nome: string;
  dente: number | null;
  faces: string[];
  quantidade: number;
  preco_unitario: number;
  observacoes: string;
}

export default function Orcamentos() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [selectedProcedimento, setSelectedProcedimento] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [orcamentoItens, setOrcamentoItens] = useState<OrcamentoItem[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedFaces, setSelectedFaces] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPacienteCombobox, setOpenPacienteCombobox] = useState(false);
  const [searchPaciente, setSearchPaciente] = useState("");
  const odontogramRef = useRef<OdontogramRef>(null);
  
  // Estados para o plano de pagamento
  const [orcamentoSalvo, setOrcamentoSalvo] = useState<any>(null);
  const [showPlanoPagamento, setShowPlanoPagamento] = useState(false);
  const [contratoModalOpen, setContratoModalOpen] = useState(false);
  const [planoSalvoId, setPlanoSalvoId] = useState<string | null>(null);
  const [taxaJurosCartao, setTaxaJurosCartao] = useState<number>(2.5);
  const [taxaJurosBoleto, setTaxaJurosBoleto] = useState<number>(1.5);
  
  const [planoData, setPlanoData] = useState({
    valor_entrada: '',
    forma_pagamento_entrada: '',
    forma_pagamento_parcelas: 'boleto',
    numero_parcelas: '1',
    data_vencimento_primeira_parcela: '',
    observacoes: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    fetchTaxaJuros();
  }, []);

  const loadData = async () => {
    try {
      const [procedimentosResult, pacientesResult] = await Promise.all([
        supabase.from("procedimentos").select("*").eq("ativo", true).order("nome"),
        supabase.from("pacientes").select("id, nome").order("nome")
      ]);

      if (procedimentosResult.error) throw procedimentosResult.error;
      if (pacientesResult.error) throw pacientesResult.error;

      setProcedimentos(procedimentosResult.data || []);
      setPacientes(pacientesResult.data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTaxaJuros = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      
      const { data } = await supabase
        .from('user_settings')
        .select('taxa_juros_cartao, taxa_juros_boleto')
        .eq('user_id', user.user.id)
        .maybeSingle();
      
      if (data) {
        setTaxaJurosCartao(data.taxa_juros_cartao || 2.5);
        setTaxaJurosBoleto(data.taxa_juros_boleto || 1.5);
      }
    } catch (error) {
      console.error('Erro ao carregar taxa de juros:', error);
    }
  };

  const handleToothSelect = (tooth: number | null, faces: string[]) => {
    setSelectedTooth(tooth);
    setSelectedFaces(faces);
  };

  const handleProcedimentoChange = (procedimentoId: string) => {
    setSelectedProcedimento(procedimentoId);
    const procedimento = procedimentos.find(p => p.id === procedimentoId);
    if (procedimento) {
      setPrecoUnitario(procedimento.preco_base.toString());
    }
  };

  const addOrcamentoItem = () => {
    if (!selectedProcedimento) {
      toast({
        title: "Erro",
        description: "Selecione um procedimento",
        variant: "destructive",
      });
      return;
    }

    const procedimento = procedimentos.find(p => p.id === selectedProcedimento);
    if (!procedimento) return;

    const newItem: OrcamentoItem = {
      id: Date.now().toString(),
      procedimento_id: selectedProcedimento,
      procedimento_nome: procedimento.nome,
      dente: selectedTooth,
      faces: selectedFaces,
      quantidade: parseInt(quantidade),
      preco_unitario: parseFloat(precoUnitario),
      observacoes
    };

    setOrcamentoItens(prev => [...prev, newItem]);
    
    // Reset form
    setSelectedProcedimento("");
    setQuantidade("1");
    setPrecoUnitario("");
    setObservacoes("");
    setSelectedTooth(null);
    setSelectedFaces([]);
    
    // Clear odontogram selection
    odontogramRef.current?.clearSelection();
  };

  const removeOrcamentoItem = (id: string) => {
    setOrcamentoItens(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return orcamentoItens.reduce((total, item) => {
      return total + (item.quantidade * item.preco_unitario);
    }, 0);
  };

  const saveOrcamento = async () => {
    if (!selectedPaciente || orcamentoItens.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione um paciente e adicione pelo menos um item",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Gerar número do orçamento
      const numeroOrcamento = `ORC-${Date.now()}`;

      // Inserir orçamento
      const { data: orcamento, error: orcamentoError } = await supabase
        .from("orcamentos")
        .insert([{
          numero_orcamento: numeroOrcamento,
          paciente_id: selectedPaciente,
          valor_total: calculateTotal(),
          user_id: user.user.id,
          status: "pendente"
        }])
        .select()
        .single();

      if (orcamentoError) throw orcamentoError;

      // Inserir itens do orçamento
      const itensForInsert = orcamentoItens.map(item => ({
        orcamento_id: orcamento.id,
        procedimento_id: item.procedimento_id,
        dente: item.dente,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        observacoes: item.observacoes
      }));

      const { error: itensError } = await supabase
        .from("orcamento_itens")
        .insert(itensForInsert);

      if (itensError) throw itensError;

      toast({
        title: "Sucesso",
        description: "Orçamento salvo com sucesso! Agora configure o plano de pagamento.",
      });

      // Salvar dados do orçamento para próxima etapa
      setOrcamentoSalvo(orcamento);
      setShowPlanoPagamento(true);
      setPlanoData(prev => ({ ...prev, valor_total: calculateTotal().toString() }));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar orçamento",
        variant: "destructive",
      });
    }
  };

  const calculateParcela = () => {
    const valorTotal = orcamentoSalvo ? orcamentoSalvo.valor_total : 0;
    const valorEntrada = parseFloat(planoData.valor_entrada) || 0;
    const numeroParcelas = parseInt(planoData.numero_parcelas) || 1;
    
    const valorRestante = valorTotal - valorEntrada;
    let valorParcela = valorRestante / numeroParcelas;
    
    // Aplicar juros se for cartão e acima de 1x
    if (planoData.forma_pagamento_parcelas === 'cartao' && numeroParcelas > 1) {
      const taxaJurosMensal = taxaJurosCartao / 100;
      const fatorJuros = Math.pow(1 + taxaJurosMensal, numeroParcelas);
      valorParcela = valorRestante * (taxaJurosMensal * fatorJuros) / (fatorJuros - 1);
    }
    
    // Aplicar juros se for boleto e acima de 1x
    if (planoData.forma_pagamento_parcelas === 'boleto' && numeroParcelas > 1) {
      const taxaJurosMensal = taxaJurosBoleto / 100;
      const fatorJuros = Math.pow(1 + taxaJurosMensal, numeroParcelas);
      valorParcela = valorRestante * (taxaJurosMensal * fatorJuros) / (fatorJuros - 1);
    }
    
    return valorParcela;
  };

  const savePlanoPagamento = async () => {
    if (!orcamentoSalvo) {
      toast({
        title: "Erro",
        description: "Orçamento não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const valorParcelaCalculado = calculateParcela();
      
      const planoDataForSave = {
        user_id: user.user.id,
        paciente_id: selectedPaciente,
        orcamento_id: orcamentoSalvo.id,
        valor_total: orcamentoSalvo.valor_total,
        valor_entrada: planoData.valor_entrada ? parseFloat(planoData.valor_entrada) : null,
        forma_pagamento_entrada: planoData.forma_pagamento_entrada || null,
        forma_pagamento_parcelas: planoData.forma_pagamento_parcelas,
        numero_parcelas: parseInt(planoData.numero_parcelas),
        valor_parcela: valorParcelaCalculado,
        data_vencimento_primeira_parcela: planoData.data_vencimento_primeira_parcela,
        status: 'ativo',
        observacoes: planoData.observacoes
      };

      const { data: planoSalvo, error } = await supabase
        .from('planos_pagamento')
        .insert([planoDataForSave])
        .select()
        .single();

      if (error) throw error;

      // Gerar as parcelas automaticamente
      const { error: errorParcelas } = await supabase.rpc('gerar_parcelas_plano', {
        p_plano_id: planoSalvo.id
      });

      if (errorParcelas) {
        console.error('Erro ao gerar parcelas:', errorParcelas);
        toast({
          title: "Aviso",
          description: "Plano criado, mas houve erro ao gerar as parcelas automaticamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Plano de pagamento criado com sucesso! As parcelas foram geradas automaticamente.",
        });
      }

      setPlanoSalvoId(planoSalvo.id);
    } catch (error) {
      console.error('Erro ao salvar plano de pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar plano de pagamento",
        variant: "destructive",
      });
    }
  };

  const resetAll = () => {
    setSelectedPaciente("");
    setOrcamentoItens([]);
    setOrcamentoSalvo(null);
    setShowPlanoPagamento(false);
    setPlanoSalvoId(null);
    setPlanoData({
      valor_entrada: '',
      forma_pagamento_entrada: '',
      forma_pagamento_parcelas: 'boleto',
      numero_parcelas: '1',
      data_vencimento_primeira_parcela: '',
      observacoes: ''
    });
  };

  const formasPagamento = ['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência Bancária'];

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Orçamentos & Planos de Pagamento</h1>
        <div className="flex gap-2">
          {!orcamentoSalvo ? (
            <Button onClick={saveOrcamento} disabled={orcamentoItens.length === 0}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Orçamento
            </Button>
          ) : (
            <>
              <Button onClick={resetAll} variant="outline">
                Novo Orçamento
              </Button>
              {planoSalvoId && (
                <Button onClick={() => setContratoModalOpen(true)}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Gerar Contrato
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Tabs value={showPlanoPagamento ? "plano" : "orcamento"} className="space-y-6">
        <TabsList>
          <TabsTrigger value="orcamento" disabled={showPlanoPagamento}>
            1. Orçamento
          </TabsTrigger>
          <TabsTrigger value="plano" disabled={!orcamentoSalvo}>
            2. Plano de Pagamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orcamento" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda - Odontograma */}
            <Card>
              <CardHeader>
                <CardTitle>Seleção de Dentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Odontogram ref={odontogramRef} onToothSelect={handleToothSelect} />
                {selectedTooth && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium">Dente selecionado: {selectedTooth}</p>
                    {selectedFaces.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Faces: {selectedFaces.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coluna Direita - Formulário e Lista */}
            <div className="space-y-6">
              {/* Seleção de Paciente */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Orçamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="paciente">Paciente</Label>
                      <Popover open={openPacienteCombobox} onOpenChange={setOpenPacienteCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openPacienteCombobox}
                            className="w-full justify-between"
                          >
                            {selectedPaciente 
                              ? pacientes.find(p => p.id === selectedPaciente)?.nome || "Paciente não encontrado"
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
                                        setSelectedPaciente(paciente.id);
                                        setOpenPacienteCombobox(false);
                                        setSearchPaciente("");
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedPaciente === paciente.id ? "opacity-100" : "opacity-0"
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
                  </div>
                </CardContent>
              </Card>

              {/* Adicionar Procedimento */}
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Procedimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     <div>
                       <Label htmlFor="procedimento">Procedimento</Label>
                       <Select value={selectedProcedimento} onValueChange={handleProcedimentoChange}>
                         <SelectTrigger>
                           <SelectValue placeholder="Selecione um procedimento" />
                         </SelectTrigger>
                         <SelectContent>
                           {procedimentos.map((procedimento) => (
                             <SelectItem key={procedimento.id} value={procedimento.id}>
                               {procedimento.nome} - R$ {procedimento.preco_base.toFixed(2)}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantidade">Quantidade</Label>
                        <Input
                          id="quantidade"
                          type="number"
                          value={quantidade}
                          onChange={(e) => setQuantidade(e.target.value)}
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="preco">Preço Unitário</Label>
                        <Input
                          id="preco"
                          type="number"
                          step="0.01"
                          value={precoUnitario}
                          onChange={(e) => setPrecoUnitario(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="obs">Observações</Label>
                      <Textarea
                        id="obs"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <Button onClick={addOrcamentoItem} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar ao Orçamento
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Itens */}
              <Card>
                <CardHeader>
                  <CardTitle>Itens do Orçamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {orcamentoItens.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum item adicionado ao orçamento
                    </p>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dente</TableHead>
                            <TableHead>Procedimento</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orcamentoItens.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.dente || "-"}</TableCell>
                              <TableCell className="font-medium">
                                {item.procedimento_nome}
                                {item.faces.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.faces.join(", ")}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{item.quantidade}</TableCell>
                              <TableCell>R$ {item.preco_unitario.toFixed(2)}</TableCell>
                              <TableCell>
                                R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeOrcamentoItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total do Orçamento:</span>
                          <span className="text-xl font-bold text-primary">
                            R$ {calculateTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plano" className="space-y-6">
          {orcamentoSalvo && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resumo do Orçamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Resumo do Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Número:</span>
                      <span>{orcamentoSalvo.numero_orcamento}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Paciente:</span>
                      <span>{pacientes.find(p => p.id === selectedPaciente)?.nome}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Valor Total:</span>
                      <span className="text-lg font-bold text-primary">
                        R$ {orcamentoSalvo.valor_total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plano de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Plano de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="valor_entrada">Valor da Entrada (R$)</Label>
                      <Input
                        id="valor_entrada"
                        type="number"
                        step="0.01"
                        value={planoData.valor_entrada}
                        onChange={(e) => setPlanoData(prev => ({ ...prev, valor_entrada: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="forma_pagamento_entrada">Forma Pagamento Entrada</Label>
                      <Select 
                        value={planoData.forma_pagamento_entrada} 
                        onValueChange={(value) => setPlanoData(prev => ({ ...prev, forma_pagamento_entrada: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {formasPagamento.map((forma) => (
                            <SelectItem key={forma} value={forma.toLowerCase().replace(' ', '_')}>
                              {forma}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="forma_pagamento_parcelas">Forma Pagamento Parcelas</Label>
                      <Select 
                        value={planoData.forma_pagamento_parcelas} 
                        onValueChange={(value) => setPlanoData(prev => ({ ...prev, forma_pagamento_parcelas: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="numero_parcelas">Número de Parcelas</Label>
                      <Select 
                        value={planoData.numero_parcelas} 
                        onValueChange={(value) => setPlanoData(prev => ({ ...prev, numero_parcelas: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: planoData.forma_pagamento_parcelas === 'boleto' ? 36 : 12 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="data_vencimento_primeira_parcela">Data de Vencimento da 1ª Parcela</Label>
                    <Input
                      id="data_vencimento_primeira_parcela"
                      type="date"
                      value={planoData.data_vencimento_primeira_parcela}
                      onChange={(e) => setPlanoData(prev => ({ ...prev, data_vencimento_primeira_parcela: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="observacoes_plano">Observações</Label>
                    <Textarea
                      id="observacoes_plano"
                      value={planoData.observacoes}
                      onChange={(e) => setPlanoData(prev => ({ ...prev, observacoes: e.target.value }))}
                      rows={3}
                      placeholder="Observações sobre o plano de pagamento..."
                    />
                  </div>

                  {/* Resumo do Plano */}
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Valor Total:</span>
                      <span>R$ {orcamentoSalvo.valor_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entrada:</span>
                      <span>R$ {(parseFloat(planoData.valor_entrada) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Restante:</span>
                      <span>R$ {(orcamentoSalvo.valor_total - (parseFloat(planoData.valor_entrada) || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Valor da Parcela:</span>
                      <span>R$ {calculateParcela().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={savePlanoPagamento} 
                    className="w-full"
                    disabled={!!planoSalvoId}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {planoSalvoId ? 'Plano Salvo' : 'Salvar Plano de Pagamento'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ContratoModal
        open={contratoModalOpen}
        onOpenChange={setContratoModalOpen}
        planoId={planoSalvoId || undefined}
      />
    </div>
  );
}