import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  FileText,
  Clock,
  DollarSign
} from "lucide-react";

interface VisualizarPacienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string | null;
}

interface PacienteDetalhes {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  cpf: string;
  endereco: string;
  profissao: string;
  estado_civil: string;
  responsavel: string;
  telefone_responsavel: string;
  observacoes: string;
}

interface Agendamento {
  id: string;
  data_agendamento: string;
  procedimento: string;
  status: string;
  observacoes: string;
}

interface Pagamento {
  id: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string;
  status: string;
  forma_pagamento: string;
}

export function VisualizarPacienteModal({ open, onOpenChange, pacienteId }: VisualizarPacienteModalProps) {
  const [paciente, setPaciente] = useState<PacienteDetalhes | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && pacienteId) {
      loadPacienteData();
    }
  }, [open, pacienteId]);

  const loadPacienteData = async () => {
    if (!pacienteId) return;
    
    setIsLoading(true);
    try {
      // Carregar dados do paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", pacienteId)
        .single();

      if (pacienteError) throw pacienteError;
      setPaciente(pacienteData);

      // Carregar agendamentos
      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("data_agendamento", { ascending: false });

      if (agendamentosError) throw agendamentosError;
      setAgendamentos(agendamentosData || []);

      // Carregar pagamentos
      const { data: pagamentosData, error: pagamentosError } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });

      if (pagamentosError) throw pagamentosError;
      setPagamentos(pagamentosData || []);

    } catch (error) {
      console.error("Erro ao carregar dados do paciente:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do paciente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      agendado: "bg-blue-100 text-blue-800",
      realizado: "bg-green-100 text-green-800",
      cancelado: "bg-red-100 text-red-800",
      pendente: "bg-yellow-100 text-yellow-800",
      pago: "bg-green-100 text-green-800"
    };
    
    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (!paciente && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detalhes do Paciente
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : paciente ? (
          <div className="space-y-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                    <p className="text-card-foreground">{paciente.nome}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Idade</label>
                    <p className="text-card-foreground">{calculateAge(paciente.data_nascimento)} anos</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CPF</label>
                    <p className="text-card-foreground">{paciente.cpf || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado Civil</label>
                    <p className="text-card-foreground">{paciente.estado_civil || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Profissão</label>
                    <p className="text-card-foreground">{paciente.profissao || "-"}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                      <p className="text-card-foreground">{paciente.telefone || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-card-foreground">{paciente.email || "-"}</p>
                    </div>
                  </div>
                </div>
                
                {paciente.endereco && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                      <p className="text-card-foreground">{paciente.endereco}</p>
                    </div>
                  </div>
                )}
                
                {(paciente.responsavel || paciente.telefone_responsavel) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Responsável</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paciente.responsavel && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Nome</label>
                            <p className="text-card-foreground">{paciente.responsavel}</p>
                          </div>
                        )}
                        {paciente.telefone_responsavel && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                            <p className="text-card-foreground">{paciente.telefone_responsavel}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                {paciente.observacoes && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Observações</label>
                      <p className="text-card-foreground mt-1">{paciente.observacoes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Histórico de Consultas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Histórico de Consultas ({agendamentos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agendamentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma consulta registrada</p>
                ) : (
                  <div className="space-y-3">
                    {agendamentos.map((agendamento) => (
                      <div key={agendamento.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{agendamento.procedimento || "Consulta"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            {agendamento.observacoes && (
                              <p className="text-sm text-muted-foreground mt-1">{agendamento.observacoes}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(agendamento.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Histórico Financeiro ({pagamentos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pagamentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum pagamento registrado</p>
                ) : (
                  <div className="space-y-3">
                    {pagamentos.map((pagamento) => (
                      <div key={pagamento.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {pagamento.forma_pagamento} • Vencimento: {' '}
                              {new Date(pagamento.data_vencimento).toLocaleDateString('pt-BR')}
                            </p>
                            {pagamento.data_pagamento && (
                              <p className="text-sm text-muted-foreground">
                                Pago em: {new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(pagamento.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}