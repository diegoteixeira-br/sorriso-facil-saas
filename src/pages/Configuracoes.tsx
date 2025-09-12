import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Building2, Save, Upload, X, CreditCard, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileSettings {
  clinic_name: string;
  razao_social?: string;
  cnpj?: string;
  endereco?: string;
  logo_url?: string;
}

interface AsaasSettings {
  api_key?: string;
  webhook_token?: string;
  environment?: 'sandbox' | 'production';
}

const Configuracoes = () => {
  const { user } = useAuth();
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    clinic_name: ''
  });
  const [asaasSettings, setAsaasSettings] = useState<AsaasSettings>({
    environment: 'sandbox'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookToken, setShowWebhookToken] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfileSettings = async () => {
    if (!user) return;
    
    try {
      // Fetch profile settings
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('clinic_name, razao_social, cnpj, endereco, logo_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        toast.error('Erro ao carregar configurações');
        console.error(profileError);
      } else {
        setProfileSettings(profileData || { clinic_name: '' });
      }

      // Fetch Asaas settings
      const { data: asaasData, error: asaasError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (asaasError && asaasError.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações do Asaas:', asaasError);
      } else if (asaasData) {
        setAsaasSettings({
          api_key: (asaasData as any).asaas_api_key || '',
          webhook_token: (asaasData as any).asaas_webhook_token || '',
          environment: (asaasData as any).asaas_environment || 'sandbox'
        });
      }
    } catch (error) {
      console.error('Erro geral ao carregar configurações:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileSettings();
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Upload logo to storage
      const { error: uploadError } = await supabase.storage
        .from('clinic-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('clinic-logos')
        .getPublicUrl(fileName);

      // Update profile with logo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfileSettings(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success('Logo atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ logo_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfileSettings(prev => ({ ...prev, logo_url: undefined }));
      toast.success('Logo removida com sucesso!');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Erro ao remover logo');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          clinic_name: profileSettings.clinic_name,
          razao_social: profileSettings.razao_social,
          cnpj: profileSettings.cnpj,
          endereco: profileSettings.endereco
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsaasSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user.id,
          asaas_api_key: asaasSettings.api_key,
          asaas_webhook_token: asaasSettings.webhook_token,
          asaas_environment: asaasSettings.environment
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Configurações do Asaas salvas com sucesso!');
    } catch (error) {
      console.error('Error saving Asaas settings:', error);
      toast.error('Erro ao salvar configurações do Asaas');
    } finally {
      setSaving(false);
    }
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

      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clinic" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Dados da Clínica
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pagamentos (Asaas)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informações da Clínica
              </CardTitle>
              <CardDescription>
                Configure o nome e a logo da sua clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="clinic_name">Nome Fantasia da Clínica *</Label>
                  <Input
                    id="clinic_name"
                    placeholder="Digite o nome fantasia da sua clínica"
                    value={profileSettings.clinic_name}
                    onChange={(e) => setProfileSettings(prev => ({
                      ...prev,
                      clinic_name: e.target.value
                    }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    placeholder="Razão social da empresa"
                    value={profileSettings.razao_social || ''}
                    onChange={(e) => setProfileSettings(prev => ({
                      ...prev,
                      razao_social: e.target.value
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={profileSettings.cnpj || ''}
                      onChange={(e) => setProfileSettings(prev => ({
                        ...prev,
                        cnpj: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, bairro, cidade, CEP"
                    value={profileSettings.endereco || ''}
                    onChange={(e) => setProfileSettings(prev => ({
                      ...prev,
                      endereco: e.target.value
                    }))}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Logo da Clínica</Label>
                  
                  {profileSettings.logo_url ? (
                    <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
                      <img 
                        src={profileSettings.logo_url} 
                        alt="Logo da clínica" 
                        className="w-16 h-16 object-contain rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Logo atual</p>
                        <p className="text-xs text-muted-foreground">
                          Esta logo aparecerá no cabeçalho do sistema
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Nenhuma logo carregada
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Carregando...' : 'Fazer Upload'}
                      </Button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  {profileSettings.logo_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Carregando...' : 'Alterar Logo'}
                    </Button>
                  )}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Configurações do Asaas
              </CardTitle>
              <CardDescription>
                Configure sua conta do Asaas para gerar boletos e cobranças automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAsaasSettings} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="environment">Ambiente</Label>
                  <select
                    id="environment"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={asaasSettings.environment}
                    onChange={(e) => setAsaasSettings(prev => ({
                      ...prev,
                      environment: e.target.value as 'sandbox' | 'production'
                    }))}
                  >
                    <option value="sandbox">Sandbox (Teste)</option>
                    <option value="production">Produção</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key do Asaas *</Label>
                  <div className="relative">
                    <Input
                      id="api_key"
                      type={showApiKey ? "text" : "password"}
                      placeholder="$aact_YTU5YjRlM2I4ODQ4YTY4Nz..."
                      value={asaasSettings.api_key || ''}
                      onChange={(e) => setAsaasSettings(prev => ({
                        ...prev,
                        api_key: e.target.value
                      }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Encontre sua API Key no painel do Asaas em Configurações → API Key
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook_token">Token do Webhook (Opcional)</Label>
                  <div className="relative">
                    <Input
                      id="webhook_token"
                      type={showWebhookToken ? "text" : "password"}
                      placeholder="Token para validação de webhooks"
                      value={asaasSettings.webhook_token || ''}
                      onChange={(e) => setAsaasSettings(prev => ({
                        ...prev,
                        webhook_token: e.target.value
                      }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowWebhookToken(!showWebhookToken)}
                    >
                      {showWebhookToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Token usado para validar webhooks do Asaas (opcional mas recomendado)
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Como configurar:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse sua conta no <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Asaas</a></li>
                    <li>Vá em <strong>Configurações → API Key</strong></li>
                    <li>Copie sua API Key e cole no campo acima</li>
                    <li>Configure webhooks se necessário para receber notificações automáticas</li>
                  </ol>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={saving || !asaasSettings.api_key}
                    className="bg-gradient-medical hover:opacity-90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;