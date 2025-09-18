export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string
          data_agendamento: string
          dentista_id: string | null
          duracao_minutos: number | null
          id: string
          lembrete_enviado: boolean | null
          observacoes: string | null
          paciente_id: string
          procedimento: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_agendamento: string
          dentista_id?: string | null
          duracao_minutos?: number | null
          id?: string
          lembrete_enviado?: boolean | null
          observacoes?: string | null
          paciente_id: string
          procedimento?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_agendamento?: string
          dentista_id?: string | null
          duracao_minutos?: number | null
          id?: string
          lembrete_enviado?: boolean | null
          observacoes?: string | null
          paciente_id?: string
          procedimento?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_dentista_id_fkey"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese: {
        Row: {
          alergias: string | null
          created_at: string
          diabetes: boolean | null
          fumante: boolean | null
          gravidez: boolean | null
          id: string
          medicamentos_uso: string | null
          observacoes_medicas: string | null
          paciente_id: string
          pressao_arterial: string | null
          problemas_cardiacos: boolean | null
          updated_at: string
        }
        Insert: {
          alergias?: string | null
          created_at?: string
          diabetes?: boolean | null
          fumante?: boolean | null
          gravidez?: boolean | null
          id?: string
          medicamentos_uso?: string | null
          observacoes_medicas?: string | null
          paciente_id: string
          pressao_arterial?: string | null
          problemas_cardiacos?: boolean | null
          updated_at?: string
        }
        Update: {
          alergias?: string | null
          created_at?: string
          diabetes?: boolean | null
          fumante?: boolean | null
          gravidez?: boolean | null
          id?: string
          medicamentos_uso?: string | null
          observacoes_medicas?: string | null
          paciente_id?: string
          pressao_arterial?: string | null
          problemas_cardiacos?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueios_agenda: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          dentista_id: string | null
          id: string
          motivo: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          dentista_id?: string | null
          id?: string
          motivo?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          dentista_id?: string | null
          id?: string
          motivo?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloqueios_agenda_dentista_id_fkey"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
        ]
      }
      dentistas: {
        Row: {
          cargo: string | null
          created_at: string
          cro: string
          email: string | null
          especialidade: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          cro: string
          email?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          cro?: string
          email?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      despesas: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string
          funcionario_id: string | null
          id: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data: string
          descricao: string
          funcionario_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          funcionario_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo: string
          created_at: string
          data_admissao: string | null
          email: string | null
          id: string
          nome: string
          salario: number | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo: string
          created_at?: string
          data_admissao?: string | null
          email?: string | null
          id?: string
          nome: string
          salario?: number | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string
          created_at?: string
          data_admissao?: string | null
          email?: string | null
          id?: string
          nome?: string
          salario?: number | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      odontograma: {
        Row: {
          created_at: string
          dente: number
          faces: Json | null
          id: string
          observacoes: string | null
          paciente_id: string
          procedimentos_realizados: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dente: number
          faces?: Json | null
          id?: string
          observacoes?: string | null
          paciente_id: string
          procedimentos_realizados?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dente?: number
          faces?: Json | null
          id?: string
          observacoes?: string | null
          paciente_id?: string
          procedimentos_realizados?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontograma_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          created_at: string
          dente: number | null
          id: string
          observacoes: string | null
          orcamento_id: string
          preco_unitario: number
          procedimento_id: string
          quantidade: number | null
        }
        Insert: {
          created_at?: string
          dente?: number | null
          id?: string
          observacoes?: string | null
          orcamento_id: string
          preco_unitario: number
          procedimento_id: string
          quantidade?: number | null
        }
        Update: {
          created_at?: string
          dente?: number | null
          id?: string
          observacoes?: string | null
          orcamento_id?: string
          preco_unitario?: number
          procedimento_id?: string
          quantidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          created_at: string
          desconto: number | null
          id: string
          numero_orcamento: string
          observacoes: string | null
          paciente_id: string
          status: string | null
          updated_at: string
          user_id: string | null
          validade_dias: number | null
          valor_total: number | null
        }
        Insert: {
          created_at?: string
          desconto?: number | null
          id?: string
          numero_orcamento: string
          observacoes?: string | null
          paciente_id: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          validade_dias?: number | null
          valor_total?: number | null
        }
        Update: {
          created_at?: string
          desconto?: number | null
          id?: string
          numero_orcamento?: string
          observacoes?: string | null
          paciente_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          validade_dias?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      paciente_arquivos: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          nome_arquivo: string
          paciente_id: string
          storage_path: string
          tamanho_arquivo: number | null
          tipo_arquivo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome_arquivo: string
          paciente_id: string
          storage_path: string
          tamanho_arquivo?: number | null
          tipo_arquivo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome_arquivo?: string
          paciente_id?: string
          storage_path?: string
          tamanho_arquivo?: number | null
          tipo_arquivo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pacientes: {
        Row: {
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          estado_civil: string | null
          id: string
          nome: string
          observacoes: string | null
          profissao: string | null
          responsavel: string | null
          sexo: string | null
          telefone: string | null
          telefone_responsavel: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado_civil?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          profissao?: string | null
          responsavel?: string | null
          sexo?: string | null
          telefone?: string | null
          telefone_responsavel?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado_civil?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          profissao?: string | null
          responsavel?: string | null
          sexo?: string | null
          telefone?: string | null
          telefone_responsavel?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          agendamento_id: string | null
          asaas_payment_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          forma_pagamento: string
          forma_pagamento_entrada: string | null
          id: string
          numero_parcelas: number | null
          observacoes: string | null
          orcamento_id: string | null
          paciente_id: string
          parcela_numero: number | null
          plano_pagamento: boolean | null
          plano_pagamento_id: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          valor: number
          valor_entrada: number | null
          valor_total: number | null
        }
        Insert: {
          agendamento_id?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          forma_pagamento: string
          forma_pagamento_entrada?: string | null
          id?: string
          numero_parcelas?: number | null
          observacoes?: string | null
          orcamento_id?: string | null
          paciente_id: string
          parcela_numero?: number | null
          plano_pagamento?: boolean | null
          plano_pagamento_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          valor: number
          valor_entrada?: number | null
          valor_total?: number | null
        }
        Update: {
          agendamento_id?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          forma_pagamento?: string
          forma_pagamento_entrada?: string | null
          id?: string
          numero_parcelas?: number | null
          observacoes?: string | null
          orcamento_id?: string | null
          paciente_id?: string
          parcela_numero?: number | null
          plano_pagamento?: boolean | null
          plano_pagamento_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          valor?: number
          valor_entrada?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_plano_pagamento_id_fkey"
            columns: ["plano_pagamento_id"]
            isOneToOne: false
            referencedRelation: "planos_pagamento"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_pagamento: {
        Row: {
          created_at: string
          data_vencimento_primeira_parcela: string | null
          forma_pagamento_entrada: string | null
          forma_pagamento_parcelas: string
          id: string
          numero_parcelas: number
          observacoes: string | null
          orcamento_id: string | null
          paciente_id: string
          parcelas_geradas: boolean | null
          status: string | null
          updated_at: string
          user_id: string
          valor_entrada: number | null
          valor_parcela: number
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_vencimento_primeira_parcela?: string | null
          forma_pagamento_entrada?: string | null
          forma_pagamento_parcelas: string
          id?: string
          numero_parcelas?: number
          observacoes?: string | null
          orcamento_id?: string | null
          paciente_id: string
          parcelas_geradas?: boolean | null
          status?: string | null
          updated_at?: string
          user_id: string
          valor_entrada?: number | null
          valor_parcela: number
          valor_total: number
        }
        Update: {
          created_at?: string
          data_vencimento_primeira_parcela?: string | null
          forma_pagamento_entrada?: string | null
          forma_pagamento_parcelas?: string
          id?: string
          numero_parcelas?: number
          observacoes?: string | null
          orcamento_id?: string | null
          paciente_id?: string
          parcelas_geradas?: boolean | null
          status?: string | null
          updated_at?: string
          user_id?: string
          valor_entrada?: number | null
          valor_parcela?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "planos_pagamento_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimentos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_base: number | null
          tempo_estimado: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_base?: number | null
          tempo_estimado?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_base?: number | null
          tempo_estimado?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clinic_name: string
          cnpj: string | null
          created_at: string
          endereco: string | null
          id: string
          logo_url: string | null
          phone: string | null
          razao_social: string | null
          slogan: string | null
          subscription_end: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_name: string
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          razao_social?: string | null
          slogan?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_name?: string
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          razao_social?: string | null
          slogan?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          asaas_api_key: string | null
          asaas_environment: string | null
          asaas_webhook_token: string | null
          created_at: string
          id: string
          taxa_juros_boleto: number | null
          taxa_juros_cartao: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_api_key?: string | null
          asaas_environment?: string | null
          asaas_webhook_token?: string | null
          created_at?: string
          id?: string
          taxa_juros_boleto?: number | null
          taxa_juros_cartao?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_api_key?: string | null
          asaas_environment?: string | null
          asaas_webhook_token?: string | null
          created_at?: string
          id?: string
          taxa_juros_boleto?: number | null
          taxa_juros_cartao?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_agendamento_conflict: {
        Args: {
          p_agendamento_id?: string
          p_data_agendamento: string
          p_dentista_id: string
          p_duracao_minutos: number
        }
        Returns: boolean
      }
      gerar_parcelas_plano: {
        Args: { p_plano_id: string }
        Returns: undefined
      }
      get_horarios_disponiveis: {
        Args: {
          p_data: string
          p_dentista_id: string
          p_duracao_minutos?: number
        }
        Returns: {
          disponivel: boolean
          horario_fim: string
          horario_inicio: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
