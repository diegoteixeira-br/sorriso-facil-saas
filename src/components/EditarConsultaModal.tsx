import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditarConsultaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamentoId: string | null;
  onSuccess: () => void;
}

interface AgendamentoData {
  id: string;
  data_agendamento: string;
  procedimento: string;
  status: string;
  observacoes: string;
  duracao_minutos: number;
}

export function EditarConsultaModal({ 
  open, 
  onOpenChange, 
  agendamentoId, 
  onSuccess 
}: EditarConsultaModalProps) {
  const [agendamento, setAgendamento] = useState<AgendamentoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && agendamentoId) {
      loadAgendamento();
    }
  }, [open, agendamentoId]);

  const loadAgendamento = async () => {
    if (!agendamentoId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("id", agendamentoId)
        .single();

      if (error) throw error;
      setAgendamento(data);
    } catch (error) {
      console.error("Erro ao carregar agendamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da consulta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agendamento) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({
          data_agendamento: agendamento.data_agendamento,
          procedimento: agendamento.procedimento,
          status: agendamento.status,
          observacoes: agendamento.observacoes,
          duracao_minutos: agendamento.duracao_minutos,
        })
        .eq("id", agendamento.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Consulta atualizada com sucesso",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar consulta:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar consulta",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Adjust for timezone offset to show local time
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  const handleDateTimeChange = (value: string) => {
    if (!agendamento) return;
    // Create date from local datetime-local input without timezone conversion
    const localDate = new Date(value);
    const offset = localDate.getTimezoneOffset();
    const utcDate = new Date(localDate.getTime() + (offset * 60 * 1000));
    setAgendamento({
      ...agendamento,
      data_agendamento: utcDate.toISOString(),
    });
  };

  if (!agendamento && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Consulta</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : agendamento ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data e Hora</Label>
              <Input
                id="data"
                type="datetime-local"
                value={formatDateTimeForInput(agendamento.data_agendamento)}
                onChange={(e) => handleDateTimeChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedimento">Procedimento</Label>
              <Input
                id="procedimento"
                value={agendamento.procedimento || ""}
                onChange={(e) => setAgendamento({
                  ...agendamento,
                  procedimento: e.target.value
                })}
                placeholder="Descrição do procedimento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (minutos)</Label>
              <Input
                id="duracao"
                type="number"
                value={agendamento.duracao_minutos || 60}
                onChange={(e) => setAgendamento({
                  ...agendamento,
                  duracao_minutos: parseInt(e.target.value) || 60
                })}
                min="15"
                max="480"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={agendamento.status}
                onValueChange={(value) => setAgendamento({
                  ...agendamento,
                  status: value
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="falta">Falta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={agendamento.observacoes || ""}
                onChange={(e) => setAgendamento({
                  ...agendamento,
                  observacoes: e.target.value
                })}
                placeholder="Observações sobre a consulta..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}