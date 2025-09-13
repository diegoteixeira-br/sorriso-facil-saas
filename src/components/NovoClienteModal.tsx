import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NovoClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NovoClienteModal({ open, onOpenChange, onSuccess }: NovoClienteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    data_nascimento: "",
    endereco: "",
    profissao: "",
    estado_civil: "",
    responsavel: "",
    telefone_responsavel: "",
    observacoes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.telefone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
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

      const payload = {
        ...formData,
        cpf: formData.cpf?.trim() ? formData.cpf.trim() : null,
        email: formData.email?.trim() ? formData.email.trim() : null,
        telefone: formData.telefone?.trim() || "",
        responsavel: formData.responsavel?.trim() || "",
        telefone_responsavel: formData.telefone_responsavel?.trim() || "",
        endereco: formData.endereco?.trim() || "",
        profissao: formData.profissao?.trim() || "",
        estado_civil: formData.estado_civil || null,
        observacoes: formData.observacoes?.trim() || "",
        user_id: user.user.id,
      };

      const { error } = await supabase
        .from("pacientes")
        .insert([payload]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Paciente cadastrado com sucesso!",
      });

      // Reset form
      setFormData({
        nome: "",
        cpf: "",
        telefone: "",
        email: "",
        data_nascimento: "",
        endereco: "",
        profissao: "",
        estado_civil: "",
        responsavel: "",
        telefone_responsavel: "",
        observacoes: "",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao cadastrar paciente:", error);
      
      let errorMessage = "Erro ao cadastrar paciente";
      
      if (error?.code === "23505" && error?.message?.includes("pacientes_cpf_key")) {
        errorMessage = "Já existe um paciente cadastrado com este CPF";
      } else if (error?.code === "23505") {
        errorMessage = "Dados duplicados - verifique CPF ou outros campos únicos";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleInputChange("cpf", e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange("telefone", e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => handleInputChange("data_nascimento", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profissao">Profissão</Label>
              <Input
                id="profissao"
                value={formData.profissao}
                onChange={(e) => handleInputChange("profissao", e.target.value)}
                placeholder="Profissão"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estado_civil">Estado Civil</Label>
              <Select value={formData.estado_civil} onValueChange={(value) => handleInputChange("estado_civil", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  <SelectItem value="uniao_estavel">União Estável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável (se menor)</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => handleInputChange("responsavel", e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone_responsavel">Telefone do Responsável</Label>
              <Input
                id="telefone_responsavel"
                value={formData.telefone_responsavel}
                onChange={(e) => handleInputChange("telefone_responsavel", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => handleInputChange("endereco", e.target.value)}
              placeholder="Endereço completo"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              placeholder="Observações adicionais"
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
              {isLoading ? "Cadastrando..." : "Cadastrar Paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}