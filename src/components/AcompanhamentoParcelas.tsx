import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Clock, AlertCircle, Eye, CreditCard } from "lucide-react";

interface Parcela {
  id: string;
  parcela_numero: number;
  valor: number;
  status: string;
  data_vencimento: string;
  forma_pagamento: string;
  observacoes?: string;
  data_pagamento?: string;
}

interface PlanoComParcelas {
  id: string;
  valor_total: number;
  numero_parcelas: number;
  paciente: {
    nome: string;
  };
  parcelas: Parcela[];
}

interface AcompanhamentoParcelasProps {
  planoId: string;
  onClose: () => void;
}

export function AcompanhamentoParcelas({ planoId, onClose }: AcompanhamentoParcelasProps) {
  const [plano, setPlano] = useState<PlanoComParcelas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchParcelas();
  }, [planoId]);

  const fetchParcelas = async () => {
    try {
      // Buscar dados do plano
      const { data: planoData, error: planoError } = await supabase
        .from('planos_pagamento')
        .select('id, valor_total, numero_parcelas, paciente_id')
        .eq('id', planoId)
        .single();

      if (planoError) throw planoError;

      // Buscar dados do paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from('pacientes')
        .select('nome')
        .eq('id', planoData.paciente_id)
        .single();

      if (pacienteError) throw pacienteError;

      // Buscar parcelas relacionadas
      const { data: parcelasData, error: parcelasError } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('plano_pagamento_id', planoId)
        .order('parcela_numero');

      if (parcelasError) throw parcelasError;

      setPlano({
        id: planoData.id,
        valor_total: planoData.valor_total,
        numero_parcelas: planoData.numero_parcelas,
        paciente: {
          nome: pacienteData.nome
        },
        parcelas: parcelasData || []
      });
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das parcelas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const marcarComoPago = async (parcelaId: string) => {
    try {
      const { error } = await supabase
        .from('pagamentos')
        .update({
          status: 'pago',
          data_pagamento: new Date().toISOString()
        })
        .eq('id', parcelaId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Parcela marcada como paga!",
      });

      // Recarregar dados
      fetchParcelas();
    } catch (error) {
      console.error('Erro ao marcar parcela como paga:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da parcela",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge variant="default" className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'pendente':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'vencido':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusParcelaByDate = (parcela: Parcela) => {
    if (parcela.status === 'pago') return 'pago';
    
    const hoje = new Date();
    const vencimento = new Date(parcela.data_vencimento);
    
    if (vencimento < hoje) return 'vencido';
    return 'pendente';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!plano) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Plano não encontrado</div>
        </CardContent>
      </Card>
    );
  }

  const parcelasPagas = plano.parcelas.filter(p => p.status === 'pago').length;
  const totalParcelas = plano.parcelas.length;
  const valorPago = plano.parcelas.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.valor, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Acompanhamento de Parcelas - {plano.paciente.nome}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <Eye className="h-4 w-4 mr-1" />
            Fechar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Resumo */}
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{parcelasPagas}/{totalParcelas}</div>
              <div className="text-sm text-muted-foreground">Parcelas Pagas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                R$ {valorPago.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Valor Recebido</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                R$ {(plano.valor_total - valorPago).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Valor Pendente</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {totalParcelas > 0 ? Math.round((parcelasPagas / totalParcelas) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Progresso</div>
            </div>
          </div>
        </div>

        {/* Tabela de Parcelas */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parcela</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Forma Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Pagamento</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plano.parcelas.map((parcela) => {
              const statusAtual = getStatusParcelaByDate(parcela);
              return (
                <TableRow key={parcela.id}>
                  <TableCell>
                    {parcela.parcela_numero === 0 ? 'Entrada' : `${parcela.parcela_numero}ª`}
                  </TableCell>
                  <TableCell>R$ {parcela.valor.toFixed(2)}</TableCell>
                  <TableCell>
                    {format(new Date(parcela.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {parcela.forma_pagamento === 'boleto' ? 'Boleto' : 
                     parcela.forma_pagamento === 'cartao' ? 'Cartão' : 
                     parcela.forma_pagamento}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(statusAtual)}
                  </TableCell>
                  <TableCell>
                    {parcela.data_pagamento 
                      ? format(new Date(parcela.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {statusAtual !== 'pago' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => marcarComoPago(parcela.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar como Pago
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}