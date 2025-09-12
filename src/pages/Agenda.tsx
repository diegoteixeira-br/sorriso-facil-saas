import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserSettings {
  google_calendar_enabled: boolean;
  google_access_token?: string;
}

const Agenda = () => {
  const { user } = useAuth();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserSettings = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('google_calendar_enabled, google_access_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      toast.error('Erro ao carregar configurações');
      console.error(error);
    } else {
      setUserSettings(data || { google_calendar_enabled: false });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserSettings();
  }, [user]);

  const handleGoogleCalendarSync = async () => {
    try {
      if (userSettings?.google_calendar_enabled) {
        // Se já está conectado, mostrar opções de gerenciamento
        toast.info('Funcionalidade de gerenciamento será implementada em breve');
        return;
      }

      // Solicitar URL de autorização do Google
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'get_auth_url' }
      });

      if (error) {
        console.error('Erro ao obter URL de autorização:', error);
        toast.error('Erro ao conectar com Google Calendar');
        return;
      }

      // Redirecionar para o Google OAuth
      window.open(data.authUrl, '_blank', 'width=500,height=600');
      
      // Aguardar confirmação (em uma implementação real, seria melhor usar postMessage)
      toast.success('Janela de autorização aberta. Complete a autorização e volte aqui.');
      
      // Atualizar configurações após um delay para dar tempo da autorização
      setTimeout(() => {
        fetchUserSettings();
      }, 3000);

    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro ao conectar com Google Calendar');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-medical rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">Agenda</h1>
            <p className="text-muted-foreground">Gerencie seus agendamentos</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 mb-6">
        {/* Google Calendar Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CalendarDays className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle>Integração com Google Calendar</CardTitle>
                <CardDescription>
                  Sincronize seus agendamentos com o Google Calendar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    userSettings?.google_calendar_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <div>
                    <p className="font-medium">Status da Sincronização</p>
                    <p className="text-sm text-muted-foreground">
                      {userSettings?.google_calendar_enabled 
                        ? 'Conectado ao Google Calendar'
                        : 'Não conectado'
                      }
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleGoogleCalendarSync}
                  variant={userSettings?.google_calendar_enabled ? "outline" : "default"}
                  className={!userSettings?.google_calendar_enabled ? "bg-gradient-medical hover:opacity-90" : ""}
                >
                  {userSettings?.google_calendar_enabled ? 'Gerenciar' : 'Conectar'}
                </Button>
              </div>

              {!userSettings?.google_calendar_enabled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Como configurar:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Vá para "Configurações" no menu lateral</li>
                    <li>2. Configure suas credenciais do Google Calendar</li>
                    <li>3. Volte aqui para ativar a sincronização</li>
                  </ol>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Calendário de Agendamentos</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os seus agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                Calendário em Desenvolvimento
              </h3>
              <p className="text-muted-foreground mb-4">
                O sistema de calendário interativo será implementado em breve
              </p>
              <Button variant="outline">
                Ver Agendamentos (Lista)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Agenda;