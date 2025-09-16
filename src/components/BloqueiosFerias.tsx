import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarIcon, Plus, Plane, Coffee, Calendar as CalendarLucide, Edit, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Bloqueio {
  id: string;
  tipo: string;
  dentista_id?: string;
  data_inicio: string;
  data_fim: string;
  motivo?: string;
  created_at: string;
  dentistas?: {
    nome: string;
  };
}

interface Dentista {
  id: string;
  nome: string;
}

const BloqueiosFerias = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBloqueio, setEditingBloqueio] = useState<Bloqueio | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    tipo: '',
    dentista_id: '',
    data_inicio: '',
    data_fim: '',
    motivo: ''
  });

  useEffect(() => {
    if (user) {
      fetchBloqueios();
      fetchDentistas();
    }
  }, [user]);

  const fetchBloqueios = async () => {
    try {
      const { data, error } = await supabase
        .from('bloqueios_agenda')
        .select(`
          *,
          dentistas (nome)
        `)
        .eq('user_id', user?.id)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      setBloqueios(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar bloqueios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDentistas = async () => {
    try {
      const { data, error } = await supabase
        .from('dentistas')
        .select('id, nome')
        .eq('user_id', user?.id);

      if (error) throw error;
      setDentistas(data || []);
    } catch (error) {
      console.error('Erro ao carregar dentistas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const bloqueioData = {
        tipo: formData.tipo,
        dentista_id: formData.dentista_id === 'all' ? null : formData.dentista_id,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        motivo: formData.motivo || null,
        user_id: user?.id
      };

      if (editingBloqueio) {
        const { error } = await supabase
          .from('bloqueios_agenda')
          .update(bloqueioData)
          .eq('id', editingBloqueio.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Bloqueio atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('bloqueios_agenda')
          .insert([bloqueioData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Bloqueio cadastrado com sucesso!",
        });
      }

      setIsModalOpen(false);
      setEditingBloqueio(null);
      resetForm();
      fetchBloqueios();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar bloqueio",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (bloqueio: Bloqueio) => {
    setEditingBloqueio(bloqueio);
    setFormData({
      tipo: bloqueio.tipo,
      dentista_id: bloqueio.dentista_id || 'all',
      data_inicio: bloqueio.data_inicio,
      data_fim: bloqueio.data_fim,
      motivo: bloqueio.motivo || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bloqueios_agenda')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Bloqueio excluído com sucesso!",
      });

      fetchBloqueios();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir bloqueio",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: '',
      dentista_id: 'all',
      data_inicio: '',
      data_fim: '',
      motivo: ''
    });
  };

  const openModal = () => {
    setEditingBloqueio(null);
    resetForm();
    setIsModalOpen(true);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ferias':
        return <Plane className="w-4 h-4" />;
      case 'folga':
        return <Coffee className="w-4 h-4" />;
      case 'feriado':
        return <CalendarLucide className="w-4 h-4" />;
      default:
        return <CalendarLucide className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ferias':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'folga':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'feriado':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Bloqueios e Férias</h2>
          <p className="text-muted-foreground">Gerencie férias, folgas e feriados</p>
        </div>
        <Button onClick={openModal} className="bg-gradient-medical">
          <Plus className="w-4 h-4 mr-2" />
          Novo Bloqueio
        </Button>
      </div>

      {/* Lista de Bloqueios */}
      <Card>
        <CardHeader>
          <CardTitle>Bloqueios Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : bloqueios.length === 0 ? (
            <div className="text-center py-8">
              <CalendarLucide className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum bloqueio cadastrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bloqueios.map((bloqueio) => (
                <div key={bloqueio.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getTipoColor(bloqueio.tipo)}>
                        <div className="flex items-center gap-1">
                          {getTipoIcon(bloqueio.tipo)}
                          {bloqueio.tipo}
                        </div>
                      </Badge>
                      
                      <span className="text-sm font-medium">
                        {bloqueio.dentistas?.nome || 'Todos os dentistas'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(bloqueio)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este bloqueio? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(bloqueio.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Período:</strong> {format(new Date(bloqueio.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(bloqueio.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    
                    {bloqueio.motivo && (
                      <div>
                        <strong>Motivo:</strong> {bloqueio.motivo}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funcionalidades em desenvolvimento */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Futuras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">✅ Controle de Bloqueios</h4>
              <p className="text-sm text-muted-foreground">
                Sistema para bloquear horários específicos por dentista ou toda a clínica
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">📅 Gestão de Feriados</h4>
              <p className="text-sm text-muted-foreground">
                Configuração automática de feriados nacionais e locais
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">🏖️ Controle de Férias</h4>
              <p className="text-sm text-muted-foreground">
                Agendamento e aprovação de férias por dentista
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para Novo/Editar Bloqueio */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingBloqueio ? 'Editar Bloqueio' : 'Novo Bloqueio'}
            </DialogTitle>
            <DialogDescription>
              {editingBloqueio 
                ? 'Edite as informações do bloqueio' 
                : 'Crie um novo bloqueio de agenda'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipo" className="text-right">
                  Tipo
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ferias">Férias</SelectItem>
                    <SelectItem value="folga">Folga</SelectItem>
                    <SelectItem value="feriado">Feriado</SelectItem>
                    <SelectItem value="bloqueio">Bloqueio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dentista_id" className="text-right">
                  Dentista
                </Label>
                <Select
                  value={formData.dentista_id}
                  onValueChange={(value) => setFormData({ ...formData, dentista_id: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o dentista (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os dentistas</SelectItem>
                    {dentistas.map((dentista) => (
                      <SelectItem key={dentista.id} value={dentista.id}>
                        {dentista.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="data_inicio" className="text-right">
                  Data Início
                </Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="data_fim" className="text-right">
                  Data Fim
                </Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="motivo" className="text-right">
                  Motivo
                </Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="col-span-3"
                  rows={3}
                  placeholder="Descreva o motivo do bloqueio (opcional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingBloqueio ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BloqueiosFerias;