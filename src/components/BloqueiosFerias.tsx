import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Plane, Coffee, Calendar as CalendarLucide } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Bloqueio {
  id: string;
  dentista_id?: string;
  tipo: 'ferias' | 'folga' | 'feriado';
  data_inicio: string;
  data_fim: string;
  motivo?: string;
  created_at: string;
  dentista?: {
    nome: string;
  };
}

interface Dentista {
  id: string;
  nome: string;
  especialidade?: string;
}

const BloqueiosFerias = () => {
  const { user } = useAuth();
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    dentista_id: '',
    tipo: 'folga' as 'ferias' | 'folga' | 'feriado',
    data_inicio: undefined as Date | undefined,
    data_fim: undefined as Date | undefined,
    motivo: '',
  });

  const fetchBloqueios = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bloqueios_agenda')
        .select(`
          *,
          dentistas(nome)
        `)
        .eq('user_id', user.id)
        .order('data_inicio', { ascending: false });

      if (error) throw error;

      setBloqueios(data || []);
    } catch (error) {
      console.error('Erro ao carregar bloqueios:', error);
      toast.error('Erro ao carregar bloqueios');
    }
  };

  const fetchDentistas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dentistas')
        .select('id, nome, especialidade')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;

      setDentistas(data || []);
    } catch (error) {
      console.error('Erro ao carregar dentistas:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBloqueios(), fetchDentistas()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.data_inicio || !formData.data_fim) {
      toast.error('Data de início e fim são obrigatórias');
      return;
    }

    if (formData.data_inicio > formData.data_fim) {
      toast.error('Data de início deve ser anterior à data de fim');
      return;
    }

    try {
      const { error } = await supabase
        .from('bloqueios_agenda')
        .insert([{
          user_id: user?.id,
          dentista_id: formData.dentista_id || null,
          tipo: formData.tipo,
          data_inicio: formData.data_inicio.toISOString(),
          data_fim: formData.data_fim.toISOString(),
          motivo: formData.motivo || null,
        }]);

      if (error) throw error;

      toast.success('Bloqueio criado com sucesso!');
      setIsModalOpen(false);
      setFormData({
        dentista_id: '',
        tipo: 'folga',
        data_inicio: undefined,
        data_fim: undefined,
        motivo: '',
      });
      fetchBloqueios();
    } catch (error) {
      console.error('Erro ao criar bloqueio:', error);
      toast.error('Erro ao criar bloqueio');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este bloqueio?')) return;

    try {
      const { error } = await supabase
        .from('bloqueios_agenda')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Bloqueio excluído com sucesso!');
      fetchBloqueios();
    } catch (error) {
      console.error('Erro ao excluir bloqueio:', error);
      toast.error('Erro ao excluir bloqueio');
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando bloqueios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Bloqueios e Férias</h2>
          <p className="text-muted-foreground">Gerencie férias, folgas e feriados</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-gradient-medical">
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
          {bloqueios.length === 0 ? (
            <div className="text-center py-8">
              <CalendarLucide className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
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
                      
                      {bloqueio.dentista && (
                        <span className="text-sm font-medium">
                          {bloqueio.dentista.nome}
                        </span>
                      )}
                      
                      {!bloqueio.dentista_id && (
                        <span className="text-sm text-muted-foreground">
                          Todos os dentistas
                        </span>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bloqueio.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Período:</strong> {' '}
                      {format(new Date(bloqueio.data_inicio), "dd/MM/yyyy", { locale: ptBR })} até{' '}
                      {format(new Date(bloqueio.data_fim), "dd/MM/yyyy", { locale: ptBR })}
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

      {/* Modal de Novo Bloqueio */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Bloqueio</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Bloqueio</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value: 'ferias' | 'folga' | 'feriado') => 
                  setFormData(prev => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="folga">Folga</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="feriado">Feriado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dentista (opcional)</Label>
              <Select 
                value={formData.dentista_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, dentista_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os dentistas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os dentistas</SelectItem>
                  {dentistas.map((dentista) => (
                    <SelectItem key={dentista.id} value={dentista.id}>
                      {dentista.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.data_inicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_inicio ? 
                        format(formData.data_inicio, "PPP", { locale: ptBR }) : 
                        "Selecione a data"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data_inicio}
                      onSelect={(date) => setFormData(prev => ({ ...prev, data_inicio: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.data_fim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_fim ? 
                        format(formData.data_fim, "PPP", { locale: ptBR }) : 
                        "Selecione a data"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data_fim}
                      onSelect={(date) => setFormData(prev => ({ ...prev, data_fim: date }))}
                      disabled={(date) => formData.data_inicio ? date < formData.data_inicio : false}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                placeholder="Descreva o motivo do bloqueio"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-medical">
                Criar Bloqueio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BloqueiosFerias;