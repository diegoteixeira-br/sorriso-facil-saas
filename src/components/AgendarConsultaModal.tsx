import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgendarConsultaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Paciente {
  id: string;
  nome: string;
}

interface Dentista {
  id: string;
  nome: string;
  especialidade: string;
}

interface Procedimento {
  id: string;
  nome: string;
  tempo_estimado: number;
}

export function AgendarConsultaModal({ open, onOpenChange, onSuccess }: AgendarConsultaModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    paciente_id: "",
    dentista_id: "",
    procedimento: "",
    data_agendamento: "",
    horario: "",
    duracao_minutos: 60,
    observacoes: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date>();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [pacientesResult, dentistasResult, procedimentosResult] = await Promise.all([
        supabase.from("pacientes").select("id, nome").order("nome"),
        supabase.from("dentistas").select("id, nome, especialidade").order("nome"),
        supabase.from("procedimentos").select("id, nome, tempo_estimado").eq("ativo", true).order("nome")
      ]);

      if (pacientesResult.error) throw pacientesResult.error;
      if (dentistasResult.error) throw dentistasResult.error;
      if (procedimentosResult.error) throw procedimentosResult.error;

      setPacientes(pacientesResult.data || []);
      setDentistas(dentistasResult.data || []);
      setProcedimentos(procedimentosResult.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paciente_id || !selectedDate || !formData.horario) {
      toast({
        title: "Erro",
        description: "Paciente, data e horário são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("Usuário não autenticado");
      }

      // Combinar data e horário
      const dataHorario = new Date(selectedDate);
      const [hora, minuto] = formData.horario.split(':');
      dataHorario.setHours(parseInt(hora), parseInt(minuto), 0, 0);

      const { error } = await supabase
        .from("agendamentos")
        .insert([{
          paciente_id: formData.paciente_id,
          dentista_id: formData.dentista_id || null,
          procedimento: formData.procedimento || null,
          data_agendamento: dataHorario.toISOString(),
          duracao_minutos: formData.duracao_minutos,
          observacoes: formData.observacoes,
          user_id: user.user.id,
          status: "agendado"
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Consulta agendada com sucesso!",
      });

      // Reset form
      setFormData({
        paciente_id: "",
        dentista_id: "",
        procedimento: "",
        data_agendamento: "",
        horario: "",
        duracao_minutos: 60,
        observacoes: "",
      });
      setSelectedDate(undefined);

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      toast({
        title: "Erro",
        description: "Erro ao agendar consulta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProcedimentoChange = (procedimentoId: string) => {
    const procedimento = procedimentos.find(p => p.id === procedimentoId);
    if (procedimento) {
      setFormData(prev => ({
        ...prev,
        procedimento: procedimento.nome,
        duracao_minutos: procedimento.tempo_estimado || 60
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Nova Consulta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paciente">Paciente *</Label>
              <Select value={formData.paciente_id} onValueChange={(value) => handleInputChange("paciente_id", value)}>
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
            
            <div className="space-y-2">
              <Label htmlFor="dentista">Dentista</Label>
              <Select value={formData.dentista_id} onValueChange={(value) => handleInputChange("dentista_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um dentista" />
                </SelectTrigger>
                <SelectContent>
                  {dentistas.map((dentista) => (
                    <SelectItem key={dentista.id} value={dentista.id}>
                      {dentista.nome} {dentista.especialidade && `- ${dentista.especialidade}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data da Consulta *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="horario">Horário *</Label>
              <Select value={formData.horario} onValueChange={(value) => handleInputChange("horario", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {formData.horario || "Selecione o horário"}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {generateTimeSlots().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="procedimento">Procedimento</Label>
              <Select onValueChange={handleProcedimentoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {procedimentos.map((procedimento) => (
                    <SelectItem key={procedimento.id} value={procedimento.id}>
                      {procedimento.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (minutos)</Label>
              <Input
                id="duracao"
                type="number"
                value={formData.duracao_minutos}
                onChange={(e) => handleInputChange("duracao_minutos", parseInt(e.target.value))}
                min="15"
                max="480"
                step="15"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              placeholder="Observações sobre a consulta"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-medical shadow-medical"
            >
              {isLoading ? "Agendando..." : "Agendar Consulta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}