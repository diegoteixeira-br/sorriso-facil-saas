import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { NovoClienteModal } from "@/components/NovoClienteModal";
import { VisualizarPacienteModal } from "@/components/VisualizarPacienteModal";
import { EditarPacienteModal } from "@/components/EditarPacienteModal";
import { EditarProcedimentoModal } from "@/components/EditarProcedimentoModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash,
  Eye,
  Loader2,
  Stethoscope
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface Patient {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  ultima_consulta: string;
  status: "ativo" | "inativo" | "pendente";
}

const getStatusBadge = (status: Patient["status"]) => {
  const variants = {
    ativo: "bg-success/10 text-success",
    inativo: "bg-muted text-muted-foreground", 
    pendente: "bg-warning/10 text-warning"
  };
  
  const labels = {
    ativo: "Ativo",
    inativo: "Inativo",
    pendente: "Pendente"
  };

  return (
    <Badge variant="secondary" className={variants[status]}>
      {labels[status]}
    </Badge>
  );
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

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisualizarModalOpen, setIsVisualizarModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditarProcedimentoModalOpen, setIsEditarProcedimentoModalOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .order("nome");

      if (error) throw error;

      // Transformar dados do Supabase para o formato esperado
      const transformedPatients = data?.map(patient => ({
        id: patient.id,
        nome: patient.nome,
        telefone: patient.telefone || "",
        email: patient.email || "",
        data_nascimento: patient.data_nascimento || "",
        ultima_consulta: "2024-01-01", // Placeholder - pode ser obtido de agendamentos
        status: "ativo" as const, // Placeholder - pode adicionar campo status na tabela
      })) || [];

      setPatients(transformedPatients);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pacientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPatient = () => {
    setIsModalOpen(true);
  };

  const handleVisualizarPaciente = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setIsVisualizarModalOpen(true);
  };

  const handleEditarPaciente = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setIsEditarModalOpen(true);
  };

  const handleEditarProcedimento = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setIsEditarProcedimentoModalOpen(true);
  };

  const handleExcluirPaciente = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPacienteId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("pacientes")
        .delete()
        .eq("id", selectedPacienteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Paciente excluído com sucesso!",
      });

      loadPatients();
      setIsDeleteDialogOpen(false);
      setSelectedPacienteId(null);
    } catch (error) {
      console.error("Erro ao excluir paciente:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir paciente",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.telefone.includes(searchTerm)
  );

  if (isLoading) {
    return <div className="p-6">Carregando pacientes...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie os pacientes da clínica</p>
        </div>
        <Button onClick={handleNewPatient} className="bg-gradient-medical shadow-medical">
          <Plus className="w-4 h-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-card-foreground">{patients.length}</div>
            <p className="text-sm text-muted-foreground">Total de Pacientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{patients.filter(p => p.status === "ativo").length}</div>
            <p className="text-sm text-muted-foreground">Pacientes Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{patients.filter(p => p.status === "pendente").length}</div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">0</div>
            <p className="text-sm text-muted-foreground">Novos este Mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum paciente encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Última Consulta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-card-foreground">{patient.nome}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3" />
                          {patient.telefone || "-"}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {patient.email || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {calculateAge(patient.data_nascimento)} anos
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3" />
                        {patient.ultima_consulta ? new Date(patient.ultima_consulta).toLocaleDateString('pt-BR') : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(patient.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleVisualizarPaciente(patient.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditarProcedimento(patient.id)}>
                            <Stethoscope className="mr-2 h-4 w-4" />
                            Editar Procedimento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditarPaciente(patient.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleExcluirPaciente(patient.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NovoClienteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={loadPatients}
      />

      <VisualizarPacienteModal
        open={isVisualizarModalOpen}
        onOpenChange={setIsVisualizarModalOpen}
        pacienteId={selectedPacienteId}
      />

      <EditarPacienteModal
        open={isEditarModalOpen}
        onOpenChange={setIsEditarModalOpen}
        pacienteId={selectedPacienteId}
        onSuccess={loadPatients}
      />

      <EditarProcedimentoModal
        open={isEditarProcedimentoModalOpen}
        onOpenChange={setIsEditarProcedimentoModalOpen}
        pacienteId={selectedPacienteId}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.
              Todos os dados relacionados (consultas, pagamentos, etc.) serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}