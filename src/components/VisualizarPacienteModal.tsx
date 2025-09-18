import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditarConsultaModal } from "./EditarConsultaModal";
import { EditarProcedimentoModal } from "./EditarProcedimentoModal";
import { UploadArquivosPaciente } from "./UploadArquivosPaciente";
import { 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  FileText,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Check,
  Square
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
  sexo: string;
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

interface ArquivoPaciente {
  id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho_arquivo: number;
  descricao?: string;
  storage_path: string;
  created_at: string;
}

interface Orcamento {
  id: string;
  numero_orcamento: string;
  valor_total: number;
  status: string;
  created_at: string;
  arquivado: boolean;
  itens: OrcamentoItem[];
}

interface OrcamentoItem {
  id: string;
  quantidade: number;
  preco_unitario: number;
  dente?: number;
  observacoes?: string;
  realizado?: boolean;
  data_realizacao?: string;
  procedimento: {
    nome: string;
  };
}

export function VisualizarPacienteModal({ open, onOpenChange, pacienteId }: VisualizarPacienteModalProps) {
  const [paciente, setPaciente] = useState<PacienteDetalhes | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoPaciente[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editarConsultaModalOpen, setEditarConsultaModalOpen] = useState(false);
  const [consultaParaEditar, setConsultaParaEditar] = useState<string | null>(null);
  const [excluirConsultaModalOpen, setExcluirConsultaModalOpen] = useState(false);
  const [consultaParaExcluir, setConsultaParaExcluir] = useState<string | null>(null);
  const [editarProcedimentoModalOpen, setEditarProcedimentoModalOpen] = useState(false);
  const [excluirOrcamentoModalOpen, setExcluirOrcamentoModalOpen] = useState(false);
  const [orcamentoParaExcluir, setOrcamentoParaExcluir] = useState<string | null>(null);
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

      // Carregar arquivos do paciente
      const { data: arquivosData, error: arquivosError } = await supabase
        .from("paciente_arquivos")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });

      if (arquivosError) throw arquivosError;
      setArquivos(arquivosData || []);

      // Carregar orçamentos do paciente
      const { data: orcamentosData, error: orcamentosError } = await supabase
        .from("orcamentos")
        .select(`
          *,
          orcamento_itens (
            *,
            procedimentos (
              nome
            )
          )
        `)
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });

      if (orcamentosError) throw orcamentosError;
      
      const orcamentosFormatados = (orcamentosData || []).map(orc => ({
        ...orc,
        itens: orc.orcamento_itens?.map((item: any) => ({
          ...item,
          procedimento: item.procedimentos
        })) || []
      }));
      
      setOrcamentos(orcamentosFormatados);

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

  const handleEditarConsulta = (agendamentoId: string) => {
    setConsultaParaEditar(agendamentoId);
    setEditarConsultaModalOpen(true);
  };

  const handleExcluirConsulta = (agendamentoId: string) => {
    setConsultaParaExcluir(agendamentoId);
    setExcluirConsultaModalOpen(true);
  };

  const confirmarExclusaoConsulta = async () => {
    if (!consultaParaExcluir) return;

    try {
      const { error } = await supabase
        .from("agendamentos")
        .delete()
        .eq("id", consultaParaExcluir);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Consulta excluída com sucesso",
      });

      // Recarregar dados
      loadPacienteData();
      setExcluirConsultaModalOpen(false);
      setConsultaParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir consulta:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir consulta",
        variant: "destructive",
      });
    }
  };

  const handleExcluirOrcamento = (orcamentoId: string) => {
    setOrcamentoParaExcluir(orcamentoId);
    setExcluirOrcamentoModalOpen(true);
  };

  const confirmarExclusaoOrcamento = async () => {
    if (!orcamentoParaExcluir) return;

    try {
      const { error } = await supabase
        .from("orcamentos")
        .delete()
        .eq("id", orcamentoParaExcluir);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Evolução de tratamento excluída com sucesso",
      });

      // Recarregar dados
      loadPacienteData();
      setExcluirOrcamentoModalOpen(false);
      setOrcamentoParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir evolução:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir evolução de tratamento",
        variant: "destructive",
      });
    }
  };

  // Função para verificar se todos os itens estão realizados e arquivar se necessário
  const verificarEArquivarTratamento = async (orcamentoId: string) => {
    try {
      // Buscar todos os itens do orçamento
      const { data: itens, error: itensError } = await supabase
        .from("orcamento_itens")
        .select("realizado")
        .eq("orcamento_id", orcamentoId);

      if (itensError) throw itensError;

      // Verificar se todos os itens estão realizados
      const todosRealizados = itens && itens.length > 0 && itens.every(item => item.realizado);

      if (todosRealizados) {
        // Arquivar o orçamento
        const { error: arquivarError } = await supabase
          .from("orcamentos")
          .update({ arquivado: true })
          .eq("id", orcamentoId);

        if (arquivarError) throw arquivarError;

        toast({
          title: "Tratamento finalizado",
          description: "Todos os procedimentos foram concluídos. A evolução do tratamento foi arquivada.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao verificar/arquivar tratamento:", error);
    }
  };

  const toggleProcedimentoRealizado = async (orcamentoIndex: number, itemIndex: number) => {
    const orcamento = orcamentos[orcamentoIndex];
    const item = orcamento.itens[itemIndex];
    const novoStatus = !item.realizado;
    
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from("orcamento_itens")
        .update({ 
          realizado: novoStatus,
          data_realizacao: novoStatus ? new Date().toISOString().split('T')[0] : null
        })
        .eq("id", item.id);

      if (error) throw error;

      // Atualizar estado local
      setOrcamentos(prevOrcamentos => {
        const newOrcamentos = [...prevOrcamentos];
        const updatedItem = newOrcamentos[orcamentoIndex].itens[itemIndex];
        
        updatedItem.realizado = novoStatus;
        
        if (novoStatus) {
          updatedItem.data_realizacao = new Date().toISOString();
        } else {
          updatedItem.data_realizacao = undefined;
        }
        
        return newOrcamentos;
      });

      // Verificar e arquivar se todos os itens estão realizados
      await verificarEArquivarTratamento(orcamento.id);

      // Recarregar dados para sincronizar com o banco
      await loadPacienteData();
      
      toast({
        title: "Status atualizado",
        description: "Status do procedimento atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do procedimento: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      agendado: "bg-blue-100 text-blue-800",
      realizado: "bg-green-100 text-green-800",
      cancelado: "bg-red-100 text-red-800",
      falta: "bg-orange-100 text-orange-800",
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
                    <label className="text-sm font-medium text-muted-foreground">Sexo</label>
                    <p className="text-card-foreground">{paciente.sexo || "-"}</p>
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
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Histórico de Consultas ({agendamentos.length})
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditarProcedimentoModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Procedimentos
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agendamentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma consulta registrada</p>
                ) : (
                  <div className="space-y-3">
                    {agendamentos.map((agendamento) => (
                      <div key={agendamento.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
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
                        <div className="flex items-center gap-2">
                          {getStatusBadge(agendamento.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evolução do Tratamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Evolução do Tratamento ({orcamentos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orcamentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma evolução de tratamento registrada</p>
                ) : (
                  <div className="space-y-4">
                    {orcamentos.map((orcamento, orcamentoIndex) => (
                      <div key={orcamento.id} className="border rounded-lg p-4">
                         <div className="flex items-center justify-between mb-3">
                           <div>
                             <div className="flex items-center gap-2">
                               <p className="font-medium">Evolução #{orcamento.numero_orcamento}</p>
                               {orcamento.arquivado && (
                                 <Badge variant="secondary" className="bg-green-100 text-green-800">
                                   Arquivado
                                 </Badge>
                               )}
                             </div>
                             <p className="text-sm text-muted-foreground">
                               {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
                             </p>
                           </div>
                           <div className="flex items-center gap-2">
                            {getStatusBadge(orcamento.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExcluirOrcamento(orcamento.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {orcamento.itens.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h5 className="text-sm font-medium mb-3">Acompanhamento do Tratamento:</h5>
                            <div className="space-y-3">
                              {orcamento.itens.map((item, itemIndex) => (
                                <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                                  <button
                                    onClick={() => toggleProcedimentoRealizado(orcamentoIndex, itemIndex)}
                                    className="mt-1 text-primary hover:text-primary/80"
                                  >
                                    {item.realizado ? (
                                      <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Square className="w-5 h-5" />
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <p className={`font-medium ${item.realizado ? 'line-through text-muted-foreground' : ''}`}>
                                      {item.procedimento.nome}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      {item.dente && <span>Dente: {item.dente}</span>}
                                      <span>Qtd: {item.quantidade}</span>
                                      <span>
                                        R$ {(item.quantidade * item.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                      {item.realizado && item.data_realizacao && (
                                        <span className="text-green-600 font-medium">
                                          Realizado em: {new Date(item.data_realizacao).toLocaleDateString('pt-BR')}
                                        </span>
                                      )}
                                    </div>
                                    {item.observacoes && (
                                      <p className="text-xs text-muted-foreground mt-1">{item.observacoes}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className={`px-2 py-1 rounded text-xs ${
                                      item.realizado 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {item.realizado ? 'Realizado' : 'Pendente'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Arquivos do Paciente */}
            {pacienteId && (
              <UploadArquivosPaciente
                pacienteId={pacienteId}
                pacienteNome={paciente.nome}
                arquivos={arquivos}
                onArquivoAdicionado={loadPacienteData}
              />
            )}

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

        <EditarConsultaModal
          open={editarConsultaModalOpen}
          onOpenChange={setEditarConsultaModalOpen}
          agendamentoId={consultaParaEditar}
          onSuccess={() => {
            loadPacienteData();
            setEditarConsultaModalOpen(false);
            setConsultaParaEditar(null);
          }}
        />

        <EditarProcedimentoModal
          open={editarProcedimentoModalOpen}
          onOpenChange={setEditarProcedimentoModalOpen}
          pacienteId={pacienteId}
        />

        <AlertDialog open={excluirConsultaModalOpen} onOpenChange={setExcluirConsultaModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta consulta? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmarExclusaoConsulta}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={excluirOrcamentoModalOpen} onOpenChange={setExcluirOrcamentoModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta evolução de tratamento? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmarExclusaoOrcamento}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}