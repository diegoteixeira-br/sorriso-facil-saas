import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, File, X, Eye, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ArquivoPaciente {
  id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho_arquivo: number;
  descricao?: string;
  storage_path: string;
  categoria: string;
  created_at: string;
}

interface UploadArquivosPacienteProps {
  pacienteId: string;
  pacienteNome: string;
  arquivos: ArquivoPaciente[];
  onArquivoAdicionado: () => void;
}

export const UploadArquivosPaciente: React.FC<UploadArquivosPacienteProps> = ({
  pacienteId,
  pacienteNome,
  arquivos,
  onArquivoAdicionado
}) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<string>('raio-x');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${pacienteId}/${Date.now()}.${fileExt}`;

      // Upload do arquivo para o storage
      const { error: uploadError } = await supabase.storage
        .from('paciente-arquivos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Salvar informações do arquivo na tabela
      const { error: dbError } = await supabase
        .from('paciente_arquivos')
        .insert({
          paciente_id: pacienteId,
          nome_arquivo: file.name,
          tipo_arquivo: file.type,
          tamanho_arquivo: file.size,
          storage_path: fileName,
          categoria: categoria,
          descricao: descricao || null,
          user_id: user.id
        });

      if (dbError) {
        throw dbError;
      }

      toast.success('Arquivo enviado com sucesso!');
      setDescricao('');
      setCategoria('raio-x');
      setDialogOpen(false);
      onArquivoAdicionado();
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (arquivo: ArquivoPaciente) => {
    try {
      const { data, error } = await supabase.storage
        .from('paciente-arquivos')
        .download(arquivo.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = arquivo.nome_arquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handlePreview = async (arquivo: ArquivoPaciente) => {
    try {
      const { data, error } = await supabase.storage
        .from('paciente-arquivos')
        .download(arquivo.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
      // Note: Don't revoke the URL immediately as it's needed for the new tab
    } catch (error) {
      console.error('Erro na visualização:', error);
      toast.error('Erro ao visualizar arquivo');
    }
  };

  const handleDelete = async (arquivo: ArquivoPaciente) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('paciente-arquivos')
        .remove([arquivo.storage_path]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('paciente_arquivos')
        .delete()
        .eq('id', arquivo.id);

      if (dbError) throw dbError;

      toast.success('Arquivo excluído com sucesso!');
      onArquivoAdicionado();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir arquivo');
    }
  };

  const isImageFile = (tipo: string) => {
    return tipo.startsWith('image/');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5" />
              Arquivos do Paciente
            </CardTitle>
            <CardDescription>
              Raio-X, exames e documentos de {pacienteNome}
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-medical hover:opacity-90">
                <Upload className="w-4 h-4 mr-2" />
                Novo Arquivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Arquivo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raio-x">Raio-X</SelectItem>
                      <SelectItem value="exame-sangue">Exame de Sangue</SelectItem>
                      <SelectItem value="outro">Outros Documentos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="arquivo">Arquivo</Label>
                  <Input
                    id="arquivo"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx"
                    disabled={uploading}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Formatos aceitos: Imagens, PDF, DOC, DOCX (máx. 10MB)
                  </p>
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Input
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Raio-X panorâmico, Hemograma completo..."
                    disabled={uploading}
                  />
                </div>
                {uploading && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Enviando arquivo...</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="raio-x" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="raio-x">Raio-X ({arquivos.filter(a => a.categoria === 'raio-x').length})</TabsTrigger>
            <TabsTrigger value="exame-sangue">Exames de Sangue ({arquivos.filter(a => a.categoria === 'exame-sangue').length})</TabsTrigger>
            <TabsTrigger value="outro">Outros ({arquivos.filter(a => a.categoria === 'outro').length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="raio-x" className="mt-6">
            {renderArquivosPorCategoria('raio-x', 'Nenhum raio-X enviado', 'Comece enviando o primeiro raio-X deste paciente')}
          </TabsContent>
          
          <TabsContent value="exame-sangue" className="mt-6">
            {renderArquivosPorCategoria('exame-sangue', 'Nenhum exame de sangue enviado', 'Comece enviando o primeiro exame de sangue deste paciente')}
          </TabsContent>
          
          <TabsContent value="outro" className="mt-6">
            {renderArquivosPorCategoria('outro', 'Nenhum documento enviado', 'Comece enviando o primeiro documento deste paciente')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  function renderArquivosPorCategoria(categoria: string, tituloVazio: string, subtituloVazio: string) {
    const arquivosFiltrados = arquivos.filter(arquivo => arquivo.categoria === categoria);
    
    if (arquivosFiltrados.length === 0) {
      return (
        <div className="text-center py-8">
          <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            {tituloVazio}
          </h3>
          <p className="text-muted-foreground mb-4">
            {subtituloVazio}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {arquivosFiltrados.map((arquivo) => (
          <div
            key={arquivo.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                {isImageFile(arquivo.tipo_arquivo) ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <File className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{arquivo.nome_arquivo}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(arquivo.tamanho_arquivo)} • {' '}
                  {new Date(arquivo.created_at).toLocaleDateString('pt-BR')}
                </p>
                {arquivo.descricao && (
                  <p className="text-xs text-muted-foreground italic">
                    {arquivo.descricao}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isImageFile(arquivo.tipo_arquivo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(arquivo)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(arquivo)}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(arquivo)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }
};