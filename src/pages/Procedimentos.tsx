import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Procedimento {
  id: string;
  nome: string;
  descricao: string | null;
  preco_base: number;
  categoria: string | null;
  tempo_estimado: number;
  ativo: boolean;
}

export default function Procedimentos() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcedimento, setEditingProcedimento] = useState<Procedimento | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco_base: "",
    categoria: "",
    tempo_estimado: "60"
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProcedimentos();
  }, []);

  const loadProcedimentos = async () => {
    try {
      const { data, error } = await supabase
        .from("procedimentos")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setProcedimentos(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar procedimentos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const procedimentoData = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        preco_base: parseFloat(formData.preco_base),
        categoria: formData.categoria || null,
        tempo_estimado: parseInt(formData.tempo_estimado),
        ativo: true
      };

      if (editingProcedimento) {
        const { error } = await supabase
          .from("procedimentos")
          .update(procedimentoData)
          .eq("id", editingProcedimento.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Procedimento atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from("procedimentos")
          .insert([procedimentoData]);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Procedimento criado com sucesso!" });
      }

      setDialogOpen(false);
      resetForm();
      loadProcedimentos();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar procedimento",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (procedimento: Procedimento) => {
    setEditingProcedimento(procedimento);
    setFormData({
      nome: procedimento.nome,
      descricao: procedimento.descricao || "",
      preco_base: procedimento.preco_base.toString(),
      categoria: procedimento.categoria || "",
      tempo_estimado: procedimento.tempo_estimado.toString()
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja inativar este procedimento?")) return;

    try {
      const { error } = await supabase
        .from("procedimentos")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Procedimento inativado com sucesso!" });
      loadProcedimentos();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao inativar procedimento",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      preco_base: "",
      categoria: "",
      tempo_estimado: "60"
    });
    setEditingProcedimento(null);
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Procedimentos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Procedimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingProcedimento ? "Editar Procedimento" : "Novo Procedimento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="restaurador">Restaurador</SelectItem>
                      <SelectItem value="endodontico">Endodôntico</SelectItem>
                      <SelectItem value="cirurgico">Cirúrgico</SelectItem>
                      <SelectItem value="protese">Prótese</SelectItem>
                      <SelectItem value="ortodontico">Ortodôntico</SelectItem>
                      <SelectItem value="periodontal">Periodontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preco_base">Preço Base (R$)</Label>
                  <Input
                    id="preco_base"
                    type="number"
                    step="0.01"
                    value={formData.preco_base}
                    onChange={(e) => setFormData({ ...formData, preco_base: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tempo_estimado">Tempo Estimado (min)</Label>
                  <Input
                    id="tempo_estimado"
                    type="number"
                    value={formData.tempo_estimado}
                    onChange={(e) => setFormData({ ...formData, tempo_estimado: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProcedimento ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Procedimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço Base</TableHead>
                <TableHead>Tempo (min)</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedimentos.map((procedimento) => (
                <TableRow key={procedimento.id}>
                  <TableCell className="font-medium">{procedimento.nome}</TableCell>
                  <TableCell>{procedimento.categoria}</TableCell>
                  <TableCell>R$ {procedimento.preco_base.toFixed(2)}</TableCell>
                  <TableCell>{procedimento.tempo_estimado}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(procedimento)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(procedimento.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}