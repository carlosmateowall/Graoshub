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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      anuncios: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          destaque_ate: string | null
          id: string
          imagem_url: string | null
          localizacao: string | null
          nome: string
          preco: number
          quantidade: number | null
          unidade: string | null
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao?: string | null
          destaque_ate?: string | null
          id?: string
          imagem_url?: string | null
          localizacao?: string | null
          nome: string
          preco?: number
          quantidade?: number | null
          unidade?: string | null
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          destaque_ate?: string | null
          id?: string
          imagem_url?: string | null
          localizacao?: string | null
          nome?: string
          preco?: number
          quantidade?: number | null
          unidade?: string | null
          user_id?: string
        }
        Relationships: []
      }
      armazens: {
        Row: {
          avaliacao: number | null
          capacidade: string | null
          cidade: string | null
          created_at: string
          id: string
          lat: number
          lng: number
          nome: string
          telefone: string | null
        }
        Insert: {
          avaliacao?: number | null
          capacidade?: string | null
          cidade?: string | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          nome: string
          telefone?: string | null
        }
        Update: {
          avaliacao?: number | null
          capacidade?: string | null
          cidade?: string | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          avaliado_id: string
          avaliador_id: string
          comentario: string | null
          created_at: string
          frete_id: string
          id: string
          nota: number
        }
        Insert: {
          avaliado_id: string
          avaliador_id: string
          comentario?: string | null
          created_at?: string
          frete_id: string
          id?: string
          nota: number
        }
        Update: {
          avaliado_id?: string
          avaliador_id?: string
          comentario?: string | null
          created_at?: string
          frete_id?: string
          id?: string
          nota?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_frete_id_fkey"
            columns: ["frete_id"]
            isOneToOne: false
            referencedRelation: "fretes"
            referencedColumns: ["id"]
          },
        ]
      }
      banned_users: {
        Row: {
          banned_by: string
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bloqueios: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      cargas: {
        Row: {
          contratante_id: string
          created_at: string
          data_coleta: string | null
          destino: string
          id: string
          observacoes: string | null
          origem: string
          quantidade: number
          status: Database["public"]["Enums"]["carga_status"]
          tipo_grao: string
          updated_at: string
          valor: number
          veiculo: string | null
        }
        Insert: {
          contratante_id: string
          created_at?: string
          data_coleta?: string | null
          destino: string
          id?: string
          observacoes?: string | null
          origem: string
          quantidade?: number
          status?: Database["public"]["Enums"]["carga_status"]
          tipo_grao: string
          updated_at?: string
          valor?: number
          veiculo?: string | null
        }
        Update: {
          contratante_id?: string
          created_at?: string
          data_coleta?: string | null
          destino?: string
          id?: string
          observacoes?: string | null
          origem?: string
          quantidade?: number
          status?: Database["public"]["Enums"]["carga_status"]
          tipo_grao?: string
          updated_at?: string
          valor?: number
          veiculo?: string | null
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          created_at: string
          frete_id: string
          id: string
          percentual: number
          status: string
          stripe_payment_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          frete_id: string
          id?: string
          percentual?: number
          status?: string
          stripe_payment_id?: string | null
          valor?: number
        }
        Update: {
          created_at?: string
          frete_id?: string
          id?: string
          percentual?: number
          status?: string
          stripe_payment_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_frete_id_fkey"
            columns: ["frete_id"]
            isOneToOne: false
            referencedRelation: "fretes"
            referencedColumns: ["id"]
          },
        ]
      }
      denuncias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          motivo: string
          reporter_id: string
          status: string
          target_id: string
          tipo: Database["public"]["Enums"]["denuncia_tipo"]
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          motivo: string
          reporter_id: string
          status?: string
          target_id: string
          tipo: Database["public"]["Enums"]["denuncia_tipo"]
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          motivo?: string
          reporter_id?: string
          status?: string
          target_id?: string
          tipo?: Database["public"]["Enums"]["denuncia_tipo"]
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          anuncio_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          anuncio_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          anuncio_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_anuncio_id_fkey"
            columns: ["anuncio_id"]
            isOneToOne: false
            referencedRelation: "anuncios"
            referencedColumns: ["id"]
          },
        ]
      }
      fretes: {
        Row: {
          aceito_em: string | null
          carga_id: string
          coletado_em: string | null
          created_at: string
          entregue_em: string | null
          id: string
          motorista_id: string
          status: Database["public"]["Enums"]["frete_status"]
        }
        Insert: {
          aceito_em?: string | null
          carga_id: string
          coletado_em?: string | null
          created_at?: string
          entregue_em?: string | null
          id?: string
          motorista_id: string
          status?: Database["public"]["Enums"]["frete_status"]
        }
        Update: {
          aceito_em?: string | null
          carga_id?: string
          coletado_em?: string | null
          created_at?: string
          entregue_em?: string | null
          id?: string
          motorista_id?: string
          status?: Database["public"]["Enums"]["frete_status"]
        }
        Relationships: [
          {
            foreignKeyName: "fretes_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "cargas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          created_at: string
          frete_id: string
          id: string
          sender_id: string
          texto: string
        }
        Insert: {
          created_at?: string
          frete_id: string
          id?: string
          sender_id: string
          texto: string
        }
        Update: {
          created_at?: string
          frete_id?: string
          id?: string
          sender_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_frete_id_fkey"
            columns: ["frete_id"]
            isOneToOne: false
            referencedRelation: "fretes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          mensagem: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cidade: string | null
          cnh_url: string | null
          created_at: string
          crlv_url: string | null
          id: string
          kyc_status: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cidade?: string | null
          cnh_url?: string | null
          created_at?: string
          crlv_url?: string | null
          id: string
          kyc_status?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cidade?: string | null
          cnh_url?: string | null
          created_at?: string
          crlv_url?: string | null
          id?: string
          kyc_status?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_frete: {
        Args: { _carga_id: string; _motorista_id: string }
        Returns: string
      }
      can_access_frete_messages: {
        Args: { _frete_id: string; _user_id: string }
        Returns: boolean
      }
      get_admin_stats: { Args: never; Returns: Json }
      get_analytics_data: { Args: { _user_id: string }; Returns: Json }
      get_user_rating: { Args: { _user_id: string }; Returns: Json }
      get_user_stats: { Args: { _user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_contratante_of_frete: {
        Args: { _frete_carga_id: string; _user_id: string }
        Returns: boolean
      }
      is_motorista_of_carga: {
        Args: { _carga_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "contratante" | "motorista" | "admin"
      carga_status: "disponivel" | "em_andamento" | "concluida" | "cancelada"
      denuncia_tipo: "anuncio" | "usuario"
      frete_status:
        | "aceito"
        | "em_coleta"
        | "em_transito"
        | "aguardando_confirmacao"
        | "entregue"
        | "cancelado"
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
    Enums: {
      app_role: ["contratante", "motorista", "admin"],
      carga_status: ["disponivel", "em_andamento", "concluida", "cancelada"],
      denuncia_tipo: ["anuncio", "usuario"],
      frete_status: [
        "aceito",
        "em_coleta",
        "em_transito",
        "aguardando_confirmacao",
        "entregue",
        "cancelado",
      ],
    },
  },
} as const
