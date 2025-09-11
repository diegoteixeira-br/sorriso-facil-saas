import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Calendar, Save, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserSettings {
  id?: string;
  google_client_id?: string;
  google_client_secret?: string;
  google_calendar_enabled: boolean;
}

const Configuracoes = () => {
  const { user } = useAuth();
  const [userSettings, setUserSettings] = useState<UserSettings>({
    google_calendar_enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);

  const fetchUserSettings = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
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

  const handleSaveGoogleSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    const settingsData = {
      user_id: user.id,
      google_client_id: userSettings.google_client_id,
      google_client_secret: userSettings.google_client_secret,
      google_calendar_enabled: userSettings.google_calendar_enabled
    };

    if (userSettings.id) {
      const { error } = await supabase
        .from('user_settings')
        .update(settingsData)
        .eq('id', userSettings.id);

      if (error) {
        toast.error('Erro ao atualizar configurações');
        console.error(error);
      } else {
        toast.success('Configurações atualizadas com sucesso!');
      }
    } else {
      const { data, error } = await supabase
        .from('user_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao salvar configurações');
        console.error(error);
      } else {
        toast.success('Configurações salvas com sucesso!');
        setUserSettings(prev => ({ ...prev, id: data.id }));
      }
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-medical rounded-lg flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="google-calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="google-calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Google Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="google-calendar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Integração com Google Calendar
              </CardTitle>
              <CardDescription>
                Configure suas credenciais para sincronizar agendamentos com o Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Instruções */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Como obter as credenciais:</h4>
                  <ol className="text-sm text-blue-800 space-y-2">
                    <li>1. Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Google Cloud Console</a></li>
                    <li>2. Crie um novo projeto ou selecione um existente</li>
                    <li>3. Ative a Google Calendar API</li>
                    <li>4. Vá em "Credenciais" e crie credenciais OAuth 2.0</li>
                    <li>5. Configure as URLs de redirecionamento autorizadas</li>
                    <li>6. Copie o Client ID e Client Secret aqui</li>
                  </ol>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Google Console
                    </a>
                  </Button>
                </div>

                <form onSubmit={handleSaveGoogleSettings} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_client_id">Google Client ID</Label>
                    <Input
                      id="google_client_id"
                      placeholder="Insira seu Google Client ID"
                      value={userSettings.google_client_id || ''}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        google_client_id: e.target.value
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_client_secret">Google Client Secret</Label>
                    <div className="relative">
                      <Input
                        id="google_client_secret"
                        type={showClientSecret ? "text" : "password"}
                        placeholder="Insira seu Google Client Secret"
                        value={userSettings.google_client_secret || ''}
                        onChange={(e) => setUserSettings(prev => ({
                          ...prev,
                          google_client_secret: e.target.value
                        }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setShowClientSecret(!showClientSecret)}
                      >
                        {showClientSecret ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="google_calendar_enabled"
                      checked={userSettings.google_calendar_enabled}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        google_calendar_enabled: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="google_calendar_enabled">
                      Ativar sincronização com Google Calendar
                    </Label>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-gradient-medical hover:opacity-90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                  </div>
                </form>

                {userSettings.google_client_id && userSettings.google_client_secret && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">✓ Credenciais configuradas</p>
                    <p className="text-sm text-green-700 mt-1">
                      Agora você pode ativar a sincronização na página de Agenda
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;