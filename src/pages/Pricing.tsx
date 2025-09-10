import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const {
    user,
    session
  } = useAuth();
  const {
    toast
  } = useToast();
  const createCheckoutSession = async (plan: string) => {
    if (!user || !session) {
      toast({
        title: "Login necessário",
        description: "Faça login para assinar um plano",
        variant: "destructive"
      });
      return;
    }
    setLoading(plan);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-checkout', {
        body: {
          plan
        }
      });
      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };
  const plans = [{
    id: 'basic',
    name: 'Básico',
    price: 'R$ 29,99',
    description: 'Ideal para clínicas pequenas',
    icon: <Zap className="w-6 h-6" />,
    features: ['Até 100 pacientes', 'Agenda básica', 'Prontuário eletrônico', 'Relatórios básicos', 'Suporte por email'],
    popular: false
  }, {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 79,99',
    description: 'Para clínicas em crescimento',
    icon: <Crown className="w-6 h-6" />,
    features: ['Pacientes ilimitados', 'Agenda avançada', 'Odontograma completo', 'Gestão financeira completa', 'Relatórios avançados', 'Integração com Asaas', 'Suporte prioritário'],
    popular: true
  }, {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'R$ 159,99',
    description: 'Para grandes clínicas e redes',
    icon: <Building className="w-6 h-6" />,
    features: ['Tudo do Premium', 'Múltiplas filiais', 'API personalizada', 'Relatórios customizados', 'Integração WhatsApp', 'Backup automático', 'Suporte 24/7', 'Gerente de conta dedicado'],
    popular: false
  }];
  return <div className="min-h-screen py-12 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-card-foreground mb-4">
            Escolha o plano ideal para sua clínica
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gerencie sua clínica odontológica com eficiência e profissionalismo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map(plan => <Card key={plan.id} className={`relative shadow-lg transition-all duration-300 hover:shadow-xl ${plan.popular ? 'border-2 border-primary transform scale-105' : 'border border-border'}`}>
              {plan.popular && <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>}
              
              <CardHeader className="text-center pb-8">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${plan.popular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-card-foreground">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-card-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => <li key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                      <span className="text-card-foreground">{feature}</span>
                    </li>)}
                </ul>

                <Button onClick={() => createCheckoutSession(plan.id)} disabled={loading === plan.id} className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : 'bg-primary/80 hover:bg-primary'}`}>
                  {loading === plan.id ? 'Processando...' : 'Assinar Agora'}
                </Button>
              </CardContent>
            </Card>)}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Todos os planos incluem 15 dias grátis. Cancele a qualquer momento.
          </p>
          <p className="text-sm text-muted-foreground">
            Dúvidas? Entre em contato conosco pelo email: suporte@sorrisofacil.com.br
          </p>
        </div>
      </div>
    </div>;
};
export default Pricing;