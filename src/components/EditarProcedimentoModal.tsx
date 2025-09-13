import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock,
  Stethoscope,
  Plus,
  Edit,
  Trash2,
  Save
} from "lucide-react";

interface EditarProcedimentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string | null;
}

interface Procedimento {
  id: string;
  data: string;
  procedimento: string;
  observacoes: string;
  status: string;
  dentista_nome?: string;
}

interface NovoProcedimento {
  data: string;
  procedimento: string;
  observacoes: string;
  status: string;
  dentista_id: string;
}

export function EditarProcedimentoModal({ open, onOpenChange, pacienteId }: EditarProcedimentoModalProps) {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [dentistas, setDentistas] = useState<any[]>([]);
  const [novoProcedimento, setNovoProcedimento] = useState<NovoProcedimento>({
    data: "",
    procedimento: "",
    observacoes: "",
    status: "realizado",
    dentista_id: ""
  });
  const [editandoProcedimento, setEditandoProcedimento] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pacienteNome, setPacienteNome] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && pacienteId) {
      loadProcedimentos();
      loadPacienteNome();
      loadDentistas();
    }
  }, [open, pacienteId]);

  const loadPacienteNome = async () => {
    if (!pacienteId) return;
    
    try {
      const { data, error } = await supabase
        .from("pacientes")
        .select("nome")
        .eq("id", pacienteId)
        .single();

      if (error) throw error;
      setPacienteNome(data.nome);
    } catch (error) {
      console.error("Erro ao carregar nome do paciente:", error);
    }
  };

  const loadDentistas = async () => {
    try {
      const { data, error } = await supabase
        .from("dentistas")
        .select("*")
        .order("nome");

      if (error) throw error;
      setDentistas(data || []);
    } catch (error) {
      console.error("Erro ao carregar dentistas:", error);
    }
  };

  const loadProcedimentos = async () => {
    if (!pacienteId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          dentistas(nome)
        `)
        .eq("paciente_id", pacienteId)
        .order("data_agendamento", { ascending: false });

      if (error) throw error;

      const transformedProcedimentos = data?.map(item => ({
        id: item.id,
        data: item.data_agendamento,
        procedimento: item.procedimento || "Consulta",
        observacoes: item.observacoes || "",
        status: item.status,
        dentista_nome: item.dentistas?.nome || "Não informado"
      })) || [];

      setProcedimentos(transformedProcedimentos);
    } catch (error) {
      console.error("Erro ao carregar procedimentos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar procedimentos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvarNovoProcedimento = async () => {
    if (!pacienteId || !novoProcedimento.data || !novoProcedimento.procedimento || !novoProcedimento.dentista_id) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("agendamentos")
        .insert({
          paciente_id: pacienteId,
          data_agendamento: novoProcedimento.data,
          procedimento: novoProcedimento.procedimento,
          observacoes: novoProcedimento.observacoes,
          status: novoProcedimento.status,
          dentista_id: novoProcedimento.dentista_id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Procedimento adicionado com sucesso",
      });

      setNovoProcedimento({
        data: "",
        procedimento: "",
        observacoes: "",
        status: "realizado",
        dentista_id: ""
      });

      loadProcedimentos();
    } catch (error) {
      console.error("Erro ao salvar procedimento:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar procedimento",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditarProcedimento = async (procedimentoId: string, dadosAtualizados: Partial<Procedimento>) => {
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({
          data_agendamento: dadosAtualizados.data,
          procedimento: dadosAtualizados.procedimento,
          observacoes: dadosAtualizados.observacoes,
          status: dadosAtualizados.status
        })
        .eq("id", procedimentoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Procedimento atualizado com sucesso",
      });

      setEditandoProcedimento(null);
      loadProcedimentos();
    } catch (error) {
      console.error("Erro ao atualizar procedimento:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar procedimento",
        variant: "destructive",
      });
    }
  };

  const handleExcluirProcedimento = async (procedimentoId: string) => {
    try {
      const { error } = await supabase
        .from("agendamentos")
        .delete()
        .eq("id", procedimentoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Procedimento excluído com sucesso",
      });

      loadProcedimentos();
    } catch (error) {
      console.error("Erro ao excluir procedimento:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir procedimento",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      agendado: "bg-blue-100 text-blue-800",
      realizado: "bg-green-100 text-green-800",
      cancelado: "bg-red-100 text-red-800",
      falta: "bg-orange-100 text-orange-800"
    };
    
    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Editar Procedimentos - {pacienteNome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar Novo Procedimento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Novo Procedimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="nova-data">Data *</Label>
                  <Input
                    id="nova-data"
                    type="datetime-local"
                    value={novoProcedimento.data}
                    onChange={(e) => setNovoProcedimento(prev => ({ ...prev, data: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="novo-procedimento">Procedimento *</Label>
                  <Input
                    id="novo-procedimento"
                    placeholder="Ex: Limpeza, Obturação, Canal..."
                    value={novoProcedimento.procedimento}
                    onChange={(e) => setNovoProcedimento(prev => ({ ...prev, procedimento: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="novo-dentista">Dentista *</Label>
                  <select
                    id="novo-dentista"
                    className="w-full p-2 border rounded-md"
                    value={novoProcedimento.dentista_id}
                    onChange={(e) => setNovoProcedimento(prev => ({ ...prev, dentista_id: e.target.value }))}
                  >
                    <option value="">Selecione um dentista</option>
                    {dentistas.map((dentista) => (
                      <option key={dentista.id} value={dentista.id}>
                        {dentista.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="nova-observacao">Observações</Label>
                <Textarea
                  id="nova-observacao"
                  placeholder="Observações sobre o procedimento..."
                  value={novoProcedimento.observacoes}
                  onChange={(e) => setNovoProcedimento(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="novo-status">Status</Label>
                <select
                  id="novo-status"
                  className="w-full p-2 border rounded-md"
                  value={novoProcedimento.status}
                  onChange={(e) => setNovoProcedimento(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="realizado">Realizado</option>
                  <option value="agendado">Agendado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="falta">Falta</option>
                </select>
              </div>

              <Button 
                onClick={handleSalvarNovoProcedimento}
                disabled={isSaving || !novoProcedimento.data || !novoProcedimento.procedimento || !novoProcedimento.dentista_id}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Adicionar Procedimento"}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Lista de Procedimentos Existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Procedimentos Realizados ({procedimentos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Carregando...</div>
                </div>
              ) : procedimentos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum procedimento registrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {procedimentos.map((procedimento) => (
                    <ProcedimentoItem
                      key={procedimento.id}
                      procedimento={procedimento}
                      isEditing={editandoProcedimento === procedimento.id}
                      onEdit={() => setEditandoProcedimento(procedimento.id)}
                      onSave={(dados) => handleEditarProcedimento(procedimento.id, dados)}
                      onCancel={() => setEditandoProcedimento(null)}
                      onDelete={() => handleExcluirProcedimento(procedimento.id)}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProcedimentoItemProps {
  procedimento: Procedimento;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (dados: Partial<Procedimento>) => void;
  onCancel: () => void;
  onDelete: () => void;
  getStatusBadge: (status: string) => JSX.Element;
}

function ProcedimentoItem({ 
  procedimento, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  getStatusBadge 
}: ProcedimentoItemProps) {
  const [editData, setEditData] = useState({
    data: procedimento.data,
    procedimento: procedimento.procedimento,
    observacoes: procedimento.observacoes,
    status: procedimento.status
  });

  const handleSave = () => {
    onSave(editData);
  };

  if (isEditing) {
    return (
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data</Label>
              <Input
                type="datetime-local"
                value={editData.data}
                onChange={(e) => setEditData(prev => ({ ...prev, data: e.target.value }))}
              />
            </div>
            <div>
              <Label>Procedimento</Label>
              <Input
                value={editData.procedimento}
                onChange={(e) => setEditData(prev => ({ ...prev, procedimento: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label>Observações</Label>
            <Textarea
              value={editData.observacoes}
              onChange={(e) => setEditData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>

          <div>
            <Label>Status</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={editData.status}
              onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="realizado">Realizado</option>
              <option value="agendado">Agendado</option>
              <option value="cancelado">Cancelado</option>
              <option value="falta">Falta</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="font-medium">{procedimento.procedimento}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(procedimento.data).toLocaleDateString('pt-BR')} às{' '}
            {new Date(procedimento.data).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            Dentista: {procedimento.dentista_nome}
          </p>
          {procedimento.observacoes && (
            <p className="text-sm text-muted-foreground mt-1">{procedimento.observacoes}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(procedimento.status)}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}