import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  data_nascimento: z.string().optional(),
  cpf: z.string().optional(),
  endereco: z.string().optional(),
  profissao: z.string().optional(),
  estado_civil: z.string().optional(),
  responsavel: z.string().optional(),
  telefone_responsavel: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditarPacienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string | null;
  onSuccess: () => void;
}

export function EditarPacienteModal({ open, onOpenChange, pacienteId, onSuccess }: EditarPacienteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      data_nascimento: "",
      cpf: "",
      endereco: "",
      profissao: "",
      estado_civil: "",
      responsavel: "",
      telefone_responsavel: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (open && pacienteId) {
      loadPacienteData();
    }
  }, [open, pacienteId]);

  const loadPacienteData = async () => {
    if (!pacienteId) return;
    
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", pacienteId)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          nome: data.nome || "",
          telefone: data.telefone || "",
          email: data.email || "",
          data_nascimento: data.data_nascimento || "",
          cpf: data.cpf || "",
          endereco: data.endereco || "",
          profissao: data.profissao || "",
          estado_civil: data.estado_civil || "",
          responsavel: data.responsavel || "",
          telefone_responsavel: data.telefone_responsavel || "",
          observacoes: data.observacoes || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do paciente:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do paciente",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!pacienteId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("pacientes")
        .update({
          nome: data.nome,
          telefone: data.telefone,
          email: data.email,
          data_nascimento: data.data_nascimento,
          cpf: data.cpf,
          endereco: data.endereco,
          profissao: data.profissao,
          estado_civil: data.estado_civil,
          responsavel: data.responsavel,
          telefone_responsavel: data.telefone_responsavel,
          observacoes: data.observacoes,
        })
        .eq("id", pacienteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Paciente atualizado com sucesso!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar paciente:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar paciente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(11) 99999-9999" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="000.000.000-00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissão</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado_civil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="uniao_estavel">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome do responsável" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone_responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Responsável</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(11) 99999-9999" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Observações gerais sobre o paciente..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}