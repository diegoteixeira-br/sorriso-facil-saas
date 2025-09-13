import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamentoId?: string;
  planoId?: string;
}

interface ContratoData {
  paciente: {
    nome: string;
    cpf?: string;
    telefone?: string;
    endereco?: string;
  };
  clinica: {
    nome: string;
    cnpj?: string;
    endereco?: string;
    telefone?: string;
  };
  orcamento: {
    numero: string;
    valor_total: number;
    itens: Array<{
      procedimento: string;
      dente?: number;
      quantidade: number;
      valor_unitario: number;
      valor_total: number;
    }>;
  };
  plano?: {
    valor_entrada?: number;
    forma_pagamento_entrada?: string;
    numero_parcelas: number;
    valor_parcela: number;
    forma_pagamento_parcelas: string;
  };
}

export const ContratoModal: React.FC<ContratoModalProps> = ({
  open,
  onOpenChange,
  orcamentoId,
  planoId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contratoData, setContratoData] = useState<ContratoData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && (orcamentoId || planoId)) {
      loadContratoData();
    }
  }, [open, orcamentoId, planoId]);

  const loadContratoData = async () => {
    setLoading(true);
    try {
      // Buscar dados da clínica
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_name, cnpj, endereco, phone')
        .eq('user_id', user?.id)
        .single();

      let orcamento = null;
      let plano = null;

      if (orcamentoId) {
        // Buscar orçamento e seus itens
        const { data: orcamentoData } = await supabase
          .from('orcamentos')
          .select(`
            numero_orcamento,
            valor_total,
            paciente:pacientes(nome, cpf, telefone, endereco),
            itens:orcamento_itens(
              quantidade,
              preco_unitario,
              dente,
              procedimento:procedimentos(nome)
            )
          `)
          .eq('id', orcamentoId)
          .single();

        orcamento = orcamentoData;
      }

      if (planoId) {
        // Buscar plano de pagamento
        const { data: planoData } = await supabase
          .from('pagamentos')
          .select(`
            valor_total,
            valor_entrada,
            forma_pagamento_entrada,
            numero_parcelas,
            valor,
            forma_pagamento,
            paciente:pacientes(nome, cpf, telefone, endereco)
          `)
          .eq('id', planoId)
          .single();

        plano = planoData;

        // Se não temos orçamento, buscar pelos dados do plano
        if (!orcamento && plano) {
          orcamento = {
            numero_orcamento: `PLANO-${planoId.slice(-8)}`,
            valor_total: plano.valor_total || plano.valor,
            paciente: plano.paciente,
            itens: []
          };
        }
      }

      if (!orcamento) {
        toast({
          title: "Erro",
          description: "Dados do orçamento não encontrados",
          variant: "destructive",
        });
        return;
      }

      const contratoInfo: ContratoData = {
        paciente: {
          nome: orcamento.paciente.nome,
          cpf: orcamento.paciente.cpf,
          telefone: orcamento.paciente.telefone,
          endereco: orcamento.paciente.endereco,
        },
        clinica: {
          nome: profile?.clinic_name || "Clínica Odontológica",
          cnpj: profile?.cnpj,
          endereco: profile?.endereco,
          telefone: profile?.phone,
        },
        orcamento: {
          numero: orcamento.numero_orcamento,
          valor_total: orcamento.valor_total,
          itens: orcamento.itens?.map((item: any) => ({
            procedimento: item.procedimento?.nome || "Procedimento",
            dente: item.dente,
            quantidade: item.quantidade,
            valor_unitario: item.preco_unitario,
            valor_total: item.quantidade * item.preco_unitario,
          })) || [],
        },
      };

      if (plano) {
        contratoInfo.plano = {
          valor_entrada: (plano.valor_entrada as number) ?? undefined,
          forma_pagamento_entrada: plano.forma_pagamento_entrada,
          numero_parcelas: Number(plano.numero_parcelas) || 1,
          valor_parcela: (plano.valor !== null && plano.valor !== undefined)
            ? Number(plano.valor)
            : (Number(plano.valor_total || 0) / (Number(plano.numero_parcelas) || 1)),
          forma_pagamento_parcelas: plano.forma_pagamento,
        };
      }

      setContratoData(contratoInfo);
    } catch (error) {
      console.error('Erro ao carregar dados do contrato:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do contrato",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && contratoData) {
      printWindow.document.write(generateContractHTML(contratoData));
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const generateContractHTML = (data: ContratoData) => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contrato de Prestação de Serviços Odontológicos</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px;
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .title { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .section { 
            margin-bottom: 25px; 
          }
          .section-title { 
            font-weight: bold; 
            font-size: 14px;
            margin-bottom: 10px;
            color: #333;
          }
          .party { 
            margin-bottom: 15px; 
            padding: 10px;
            background: #f9f9f9;
          }
          .services-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
          }
          .services-table th, .services-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          .services-table th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          .total { 
            font-weight: bold; 
            font-size: 14px;
            text-align: right;
            margin: 15px 0;
          }
          .signatures { 
            margin-top: 60px; 
            display: flex; 
            justify-content: space-between;
          }
          .signature-box { 
            width: 45%; 
            text-align: center;
            border-top: 1px solid #333;
            padding-top: 10px;
          }
          .clause { 
            margin-bottom: 15px; 
            text-align: justify;
          }
          .page-break { 
            page-break-before: always; 
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS</div>
          <div>Orçamento: ${data.orcamento.numero}</div>
          <div>Data: ${hoje}</div>
        </div>

        <div class="section">
          <div class="section-title">CONTRATANTE (PACIENTE):</div>
          <div class="party">
            <strong>Nome:</strong> ${data.paciente.nome}<br>
            ${data.paciente.cpf ? `<strong>CPF:</strong> ${data.paciente.cpf}<br>` : ''}
            ${data.paciente.telefone ? `<strong>Telefone:</strong> ${data.paciente.telefone}<br>` : ''}
            ${data.paciente.endereco ? `<strong>Endereço:</strong> ${data.paciente.endereco}` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">CONTRATADO (PRESTADOR DE SERVIÇOS):</div>
          <div class="party">
            <strong>Razão Social:</strong> ${data.clinica.nome}<br>
            ${data.clinica.cnpj ? `<strong>CNPJ:</strong> ${data.clinica.cnpj}<br>` : ''}
            ${data.clinica.telefone ? `<strong>Telefone:</strong> ${data.clinica.telefone}<br>` : ''}
            ${data.clinica.endereco ? `<strong>Endereço:</strong> ${data.clinica.endereco}` : ''}
          </div>
        </div>

          <div class="section">
            <div class="section-title">SERVIÇOS A SEREM PRESTADOS:</div>
            ${data.orcamento.itens.length > 0 ? `
              <table class="services-table">
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th>Dente</th>
                    <th>Qtd</th>
                    <th>Valor Unit.</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.orcamento.itens.map(item => `
                    <tr>
                      <td>${item.procedimento}</td>
                      <td>${item.dente || '-'}</td>
                      <td>${item.quantidade}</td>
                      <td>R$ ${item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>R$ ${item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
            <div class="total">
              <strong>VALOR TOTAL DOS SERVIÇOS: R$ ${data.orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

        ${data.plano ? `
          <div class="section">
            <div class="section-title">CONDIÇÕES DE PAGAMENTO:</div>
            ${data.plano.valor_entrada ? `
              <p><strong>Entrada:</strong> R$ ${data.plano.valor_entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
              ${data.plano.forma_pagamento_entrada ? `(${data.plano.forma_pagamento_entrada})` : ''}</p>
            ` : ''}
            <p><strong>Parcelamento:</strong> ${data.plano.numero_parcelas}x de R$ ${data.plano.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
            (${data.plano.forma_pagamento_parcelas})</p>
            <div class="total" style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
              <strong>VALOR TOTAL A SER PAGO: R$ ${((data.plano.valor_entrada || 0) + (data.plano.numero_parcelas * data.plano.valor_parcela)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">CLÁUSULAS GERAIS:</div>
          
          <div class="clause">
            <strong>1. DO OBJETO:</strong> O presente contrato tem por objeto a prestação de serviços odontológicos especificados acima pelo CONTRATADO ao CONTRATANTE.
          </div>

          <div class="clause">
            <strong>2. DAS OBRIGAÇÕES DO CONTRATADO:</strong> O CONTRATADO se compromete a executar os serviços com diligência e perícia, utilizando materiais de qualidade e seguindo as normas técnicas e éticas da profissão.
          </div>

          <div class="clause">
            <strong>3. DAS OBRIGAÇÕES DO CONTRATANTE:</strong> O CONTRATANTE se compromete a comparecer às consultas agendadas, seguir as orientações pós-tratamento e efetuar os pagamentos nas datas estabelecidas.
          </div>

          <div class="clause">
            <strong>4. DO PAGAMENTO:</strong> O pagamento deverá ser efetuado conforme as condições estabelecidas acima. O atraso no pagamento poderá acarretar na suspensão do tratamento.
          </div>

          <div class="clause">
            <strong>5. DO PRAZO:</strong> O tratamento será realizado conforme cronograma a ser estabelecido entre as partes, respeitando as necessidades clínicas e disponibilidade de agenda.
          </div>

          <div class="clause">
            <strong>6. DA GARANTIA:</strong> Os serviços prestados possuem garantia conforme estabelecido pelo Conselho Federal de Odontologia e legislação vigente.
          </div>

          <div class="clause">
            <strong>7. DISPOSIÇÕES GERAIS:</strong> Este contrato entra em vigor na data de sua assinatura e permanece válido até a conclusão dos serviços. Casos omissos serão resolvidos conforme legislação vigente.
          </div>
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div>_________________________________</div>
            <div><strong>${data.paciente.nome}</strong></div>
            <div>CONTRATANTE</div>
          </div>
          <div class="signature-box">
            <div>_________________________________</div>
            <div><strong>Profissional Responsável</strong></div>
            <div>CONTRATADO</div>
          </div>
        </div>

        <div class="page-break">
          <div class="header">
            <div class="title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS</div>
            <div><strong>2ª VIA - ARQUIVO DA CLÍNICA</strong></div>
            <div>Orçamento: ${data.orcamento.numero}</div>
            <div>Data: ${hoje}</div>
          </div>

          <div class="section">
            <div class="section-title">CONTRATANTE (PACIENTE):</div>
            <div class="party">
              <strong>Nome:</strong> ${data.paciente.nome}<br>
              ${data.paciente.cpf ? `<strong>CPF:</strong> ${data.paciente.cpf}<br>` : ''}
              ${data.paciente.telefone ? `<strong>Telefone:</strong> ${data.paciente.telefone}<br>` : ''}
              ${data.paciente.endereco ? `<strong>Endereço:</strong> ${data.paciente.endereco}` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">CONTRATADO (PRESTADOR DE SERVIÇOS):</div>
            <div class="party">
              <strong>Razão Social:</strong> ${data.clinica.nome}<br>
              ${data.clinica.cnpj ? `<strong>CNPJ:</strong> ${data.clinica.cnpj}<br>` : ''}
              ${data.clinica.telefone ? `<strong>Telefone:</strong> ${data.clinica.telefone}<br>` : ''}
              ${data.clinica.endereco ? `<strong>Endereço:</strong> ${data.clinica.endereco}` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">SERVIÇOS A SEREM PRESTADOS:</div>
            ${data.orcamento.itens.length > 0 ? `
              <table class="services-table">
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th>Dente</th>
                    <th>Qtd</th>
                    <th>Valor Unit.</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.orcamento.itens.map(item => `
                    <tr>
                      <td>${item.procedimento}</td>
                      <td>${item.dente || '-'}</td>
                      <td>${item.quantidade}</td>
                      <td>R$ ${item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>R$ ${item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
            <div class="total">
              <strong>VALOR TOTAL DOS SERVIÇOS: R$ ${data.orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <div class="total">
            <strong>VALOR TOTAL: R$ ${data.orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>

          ${data.plano ? `
            <div class="section">
              <div class="section-title">CONDIÇÕES DE PAGAMENTO:</div>
              ${data.plano.valor_entrada ? `
                <p><strong>Entrada:</strong> R$ ${data.plano.valor_entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                ${data.plano.forma_pagamento_entrada ? `(${data.plano.forma_pagamento_entrada})` : ''}</p>
              ` : ''}
              <p><strong>Parcelamento:</strong> ${data.plano.numero_parcelas}x de R$ ${data.plano.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
              (${data.plano.forma_pagamento_parcelas})</p>
              <div class="total" style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
                <strong>VALOR TOTAL A SER PAGO: R$ ${((data.plano.valor_entrada || 0) + (data.plano.numero_parcelas * data.plano.valor_parcela)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          ` : ''}

          <div class="signatures">
            <div class="signature-box">
              <div>_________________________________</div>
              <div><strong>${data.paciente.nome}</strong></div>
              <div>CONTRATANTE</div>
            </div>
            <div class="signature-box">
              <div>_________________________________</div>
              <div><strong>Profissional Responsável</strong></div>
              <div>CONTRATADO</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrato de Prestação de Serviços
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div>Carregando dados do contrato...</div>
          </div>
        ) : contratoData ? (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Resumo do Contrato</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Paciente:</strong> {contratoData.paciente.nome}
                </div>
                <div>
                  <strong>Clínica:</strong> {contratoData.clinica.nome}
                </div>
                <div>
                  <strong>Orçamento:</strong> {contratoData.orcamento.numero}
                </div>
                <div>
                  <strong>Valor Total:</strong> R$ {contratoData.orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Imprimir Contrato (2 vias)
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p><strong>Instruções:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>O contrato será impresso em 2 vias automaticamente</li>
                <li>Uma via para o paciente e outra para arquivo da clínica</li>
                <li>Ambas as partes devem assinar as duas vias</li>
                <li>Guarde a via da clínica em local seguro</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <p>Não foi possível carregar os dados do contrato.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};