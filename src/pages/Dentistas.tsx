import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Dentista {
  id: string;
  nome: string;
  cro: string;
  especialidade?: string;
  email?: string;
  telefone?: string;
}

const Dentistas = () => {
  const { user } = useAuth();
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDentista, setEditingDentista] = useState<Dentista | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cro: '',
    especialidade: '',
    email: '',
    telefone: ''
  });

  const fetchDentistas = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('dentistas')
      .select('*')
      .eq('user_id', user.id)
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar dentistas');
      console.error(error);
    } else {
      setDentistas(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDentistas();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Erro: usuário não autenticado');
      return;
    }

    console.log('Dados do dentista:', formData);
    console.log('User ID:', user.id);

    const email = formData.email?.trim() || '';
    const telefone = formData.telefone?.trim() || '';
    const especialidade = formData.especialidade?.trim() || '';

    const dentistData = {
      nome: formData.nome.trim(),
      cro: formData.cro.trim(),
      especialidade: especialidade || null,
      email: email || null,
      telefone: telefone || null,
      user_id: user.id
    };

    if (editingDentista) {
      const { error } = await supabase
        .from('dentistas')
        .update(dentistData)
        .eq('id', editingDentista.id);

      if (error) {
        console.error('Erro detalhado (update):', error);
        if ((error as any).code === '23505' && (error as any).message?.includes('dentistas_email_key')) {
          toast.error('Já existe um dentista com este e-mail. Altere o e-mail ou deixe em branco.');
        } else {
          toast.error('Erro ao atualizar dentista');
        }
      } else {
        toast.success('Dentista atualizado com sucesso!');
        setDialogOpen(false);
        resetForm();
        fetchDentistas();
      }
    } else {
      const { data, error } = await supabase
        .from('dentistas')
        .insert(dentistData)
        .select();

      if (error) {
        console.error('Erro detalhado (insert):', error);
        if ((error as any).code === '23505' && (error as any).message?.includes('dentistas_email_key')) {
          toast.error('Já existe um dentista com este e-mail. Altere o e-mail ou deixe em branco.');
        } else {
          toast.error(`Erro ao cadastrar dentista: ${error.message}`);
        }
      } else {
        console.log('Dentista cadastrado:', data);
        toast.success('Dentista cadastrado com sucesso!');
        setDialogOpen(false);
        resetForm();
        fetchDentistas();
      }
    }
  };

  const handleEdit = (dentista: Dentista) => {
    setEditingDentista(dentista);
    setFormData({
      nome: dentista.nome,
      cro: dentista.cro,
      especialidade: dentista.especialidade || '',
      email: dentista.email || '',
      telefone: dentista.telefone || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este dentista?')) return;

    const { error } = await supabase
      .from('dentistas')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir dentista');
      console.error(error);
    } else {
      toast.success('Dentista excluído com sucesso!');
      fetchDentistas();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cro: '',
      especialidade: '',
      email: '',
      telefone: ''
    });
    setEditingDentista(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-medical rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">Dentistas</h1>
            <p className="text-muted-foreground">Gerencie sua equipe odontológica</p>
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Dentista
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDentista ? 'Editar Dentista' : 'Novo Dentista'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cro">CRO *</Label>
                <Input
                  id="cro"
                  value={formData.cro}
                  onChange={(e) => setFormData({ ...formData, cro: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-medical hover:opacity-90">
                  {editingDentista ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Dentistas</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os dentistas cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dentistas.length === 0 ? (
            <div className="text-center py-8">
              <Stethoscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                Nenhum dentista cadastrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Comece cadastrando o primeiro dentista da sua clínica
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-medical hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Dentista
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CRO</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dentistas.map((dentista) => (
                  <TableRow key={dentista.id}>
                    <TableCell className="font-medium">{dentista.nome}</TableCell>
                    <TableCell>{dentista.cro}</TableCell>
                    <TableCell>{dentista.especialidade || '-'}</TableCell>
                    <TableCell>{dentista.email || '-'}</TableCell>
                    <TableCell>{dentista.telefone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(dentista)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(dentista.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dentistas;