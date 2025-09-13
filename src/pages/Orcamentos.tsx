import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Save, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Odontogram } from "@/components/Odontogram";
import { ContratoModal } from "@/components/ContratoModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [contratoModalOpen, setContratoModalOpen] = useState(false);
  const [orcamentoSalvoId, setOrcamentoSalvoId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
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
        description: "Orçamento salvo com sucesso!",
      });

      // Salvar o ID do orçamento para gerar contrato
      setOrcamentoSalvoId(orcamento.id);

      // Reset form
      setSelectedPaciente("");
      setOrcamentoItens([]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar orçamento",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Orçamentos</h1>
        <div className="flex gap-2">
          <Button onClick={saveOrcamento} disabled={orcamentoItens.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Orçamento
          </Button>
          {orcamentoSalvoId && (
            <Button
              onClick={() => setContratoModalOpen(true)}
              variant="outline"
            >
              <FileCheck className="mr-2 h-4 w-4" />
              Gerar Contrato
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Odontograma */}
        <Card>
          <CardHeader>
            <CardTitle>Seleção de Dentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Odontogram onToothSelect={handleToothSelect} />
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
                  <Select value={selectedPaciente} onValueChange={setSelectedPaciente}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
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

      <ContratoModal
        open={contratoModalOpen}
        onOpenChange={setContratoModalOpen}
        orcamentoId={orcamentoSalvoId || undefined}
      />
    </div>
  );
}