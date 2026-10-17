export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          accion: string
          antes: Json | null
          created_at: string
          despues: Json | null
          id: string
          registro_id: string | null
          tabla: string
          updated_at: string
          usuario_id: string | null
          usuario_nombre: string | null
        }
        ComputedFields: never
        Insert: {
          accion: string
          antes?: Json | null
          created_at?: string
          despues?: Json | null
          id?: string
          registro_id?: string | null
          tabla: string
          updated_at?: string
          usuario_id?: string | null
          usuario_nombre?: string | null
        }
        Update: {
          accion?: string
          antes?: Json | null
          created_at?: string
          despues?: Json | null
          id?: string
          registro_id?: string | null
          tabla?: string
          updated_at?: string
          usuario_id?: string | null
          usuario_nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'auditoria_usuario_id_fkey'
            columns: ['usuario_id']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
        ]
      }
      categorias_egreso: {
        Row: {
          activa: boolean
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracion: {
        Row: {
          created_at: string
          id: string
          tope_confirmacion: number
          unica: boolean
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          tope_confirmacion?: number
          unica?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          tope_confirmacion?: number
          unica?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      egresos: {
        Row: {
          anulado: boolean
          anulado_en: string | null
          anulado_por: string | null
          categoria_id: string
          created_at: string
          descripcion: string
          fecha: string
          id: string
          medio_pago: Database['public']['Enums']['medio_pago']
          monto: number
          motivo_anulacion: string | null
          proveedor: string | null
          registrado_por: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          anulado?: boolean
          anulado_en?: string | null
          anulado_por?: string | null
          categoria_id: string
          created_at?: string
          descripcion: string
          fecha: string
          id?: string
          medio_pago: Database['public']['Enums']['medio_pago']
          monto: number
          motivo_anulacion?: string | null
          proveedor?: string | null
          registrado_por?: string
          updated_at?: string
        }
        Update: {
          anulado?: boolean
          anulado_en?: string | null
          anulado_por?: string | null
          categoria_id?: string
          created_at?: string
          descripcion?: string
          fecha?: string
          id?: string
          medio_pago?: Database['public']['Enums']['medio_pago']
          monto?: number
          motivo_anulacion?: string | null
          proveedor?: string | null
          registrado_por?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'egresos_anulado_por_fkey'
            columns: ['anulado_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'egresos_categoria_id_fkey'
            columns: ['categoria_id']
            isOneToOne: false
            referencedRelation: 'categorias_egreso'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'egresos_registrado_por_fkey'
            columns: ['registrado_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
        ]
      }
      empleados: {
        Row: {
          activo: boolean
          created_at: string
          fecha_ingreso: string | null
          id: string
          nombre: string
          nota: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          activo?: boolean
          created_at?: string
          fecha_ingreso?: string | null
          id?: string
          nombre: string
          nota?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          fecha_ingreso?: string | null
          id?: string
          nombre?: string
          nota?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      jornadas: {
        Row: {
          abierta_en: string
          abierta_por: string
          cerrada_en: string | null
          cerrada_por: string | null
          created_at: string
          diferencia_efectivo: number | null
          efectivo_contado: number | null
          estado: Database['public']['Enums']['estado_jornada']
          fecha: string
          fondo_inicial: number
          id: string
          nota_cierre: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          abierta_en?: string
          abierta_por: string
          cerrada_en?: string | null
          cerrada_por?: string | null
          created_at?: string
          diferencia_efectivo?: number | null
          efectivo_contado?: number | null
          estado?: Database['public']['Enums']['estado_jornada']
          fecha: string
          fondo_inicial?: number
          id?: string
          nota_cierre?: string | null
          updated_at?: string
        }
        Update: {
          abierta_en?: string
          abierta_por?: string
          cerrada_en?: string | null
          cerrada_por?: string | null
          created_at?: string
          diferencia_efectivo?: number | null
          efectivo_contado?: number | null
          estado?: Database['public']['Enums']['estado_jornada']
          fecha?: string
          fondo_inicial?: number
          id?: string
          nota_cierre?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'jornadas_abierta_por_fkey'
            columns: ['abierta_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'jornadas_cerrada_por_fkey'
            columns: ['cerrada_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
        ]
      }
      pagos_empleados: {
        Row: {
          created_at: string
          empleado_id: string
          fecha: string
          id: string
          medio_pago: Database['public']['Enums']['medio_pago']
          monto: number
          nota: string | null
          periodo: string
          registrado_por: string
          tipo: Database['public']['Enums']['tipo_pago_empleado']
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          empleado_id: string
          fecha: string
          id?: string
          medio_pago: Database['public']['Enums']['medio_pago']
          monto: number
          nota?: string | null
          periodo: string
          registrado_por?: string
          tipo: Database['public']['Enums']['tipo_pago_empleado']
          updated_at?: string
        }
        Update: {
          created_at?: string
          empleado_id?: string
          fecha?: string
          id?: string
          medio_pago?: Database['public']['Enums']['medio_pago']
          monto?: number
          nota?: string | null
          periodo?: string
          registrado_por?: string
          tipo?: Database['public']['Enums']['tipo_pago_empleado']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pagos_empleados_empleado_id_fkey'
            columns: ['empleado_id']
            isOneToOne: false
            referencedRelation: 'empleados'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pagos_empleados_registrado_por_fkey'
            columns: ['registrado_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          created_at: string
          debe_cambiar_clave: boolean
          email: string | null
          id: string
          nombre: string
          rol: Database['public']['Enums']['rol_usuario']
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          activo?: boolean
          created_at?: string
          debe_cambiar_clave?: boolean
          email?: string | null
          id: string
          nombre: string
          rol?: Database['public']['Enums']['rol_usuario']
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          debe_cambiar_clave?: boolean
          email?: string | null
          id?: string
          nombre?: string
          rol?: Database['public']['Enums']['rol_usuario']
          updated_at?: string
        }
        Relationships: []
      }
      ventas: {
        Row: {
          anulada: boolean
          anulada_en: string | null
          anulada_por: string | null
          created_at: string
          id: string
          importe: number
          jornada_id: string
          medio_pago: Database['public']['Enums']['medio_pago']
          motivo_anulacion: string | null
          registrada_en: string
          registrada_por: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          anulada?: boolean
          anulada_en?: string | null
          anulada_por?: string | null
          created_at?: string
          id?: string
          importe: number
          jornada_id: string
          medio_pago: Database['public']['Enums']['medio_pago']
          motivo_anulacion?: string | null
          registrada_en?: string
          registrada_por: string
          updated_at?: string
        }
        Update: {
          anulada?: boolean
          anulada_en?: string | null
          anulada_por?: string | null
          created_at?: string
          id?: string
          importe?: number
          jornada_id?: string
          medio_pago?: Database['public']['Enums']['medio_pago']
          motivo_anulacion?: string | null
          registrada_en?: string
          registrada_por?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ventas_anulada_por_fkey'
            columns: ['anulada_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ventas_jornada_id_fkey'
            columns: ['jornada_id']
            isOneToOne: false
            referencedRelation: 'jornadas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ventas_registrada_por_fkey'
            columns: ['registrada_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      abrir_jornada: {
        Args: { p_fondo_inicial?: number }
        Returns: {
          abierta_en: string
          abierta_por: string
          cerrada_en: string | null
          cerrada_por: string | null
          created_at: string
          diferencia_efectivo: number | null
          efectivo_contado: number | null
          estado: Database['public']['Enums']['estado_jornada']
          fecha: string
          fondo_inicial: number
          id: string
          nota_cierre: string | null
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'jornadas'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      anular_venta: {
        Args: { p_motivo: string; p_venta_id: string }
        Returns: {
          anulada: boolean
          anulada_en: string | null
          anulada_por: string | null
          created_at: string
          id: string
          importe: number
          jornada_id: string
          medio_pago: Database['public']['Enums']['medio_pago']
          motivo_anulacion: string | null
          registrada_en: string
          registrada_por: string
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'ventas'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cerrar_jornada: {
        Args: { p_efectivo_contado: number; p_jornada_id: string; p_nota?: string }
        Returns: {
          abierta_en: string
          abierta_por: string
          cerrada_en: string | null
          cerrada_por: string | null
          created_at: string
          diferencia_efectivo: number | null
          efectivo_contado: number | null
          estado: Database['public']['Enums']['estado_jornada']
          fecha: string
          fondo_inicial: number
          id: string
          nota_cierre: string | null
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'jornadas'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      egresos_por_categoria: {
        Args: { p_desde: string; p_hasta: string }
        Returns: {
          cantidad: number
          categoria: string
          categoria_id: string
          total: number
        }[]
      }
      es_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      exigir_admin: { Args: Record<PropertyKey, never>; Returns: undefined }
      exigir_usuario_activo: { Args: Record<PropertyKey, never>; Returns: undefined }
      facturacion_agrupada: {
        Args: { p_desde: string; p_hasta: string; p_unidad: string }
        Returns: {
          cantidad_ventas: number
          dias_trabajados: number
          periodo: string
          total: number
          total_digital: number
          total_efectivo: number
        }[]
      }
      facturacion_por_dia: {
        Args: { p_desde: string; p_hasta: string }
        Returns: {
          cantidad_ventas: number
          fecha: string
          total: number
          total_digital: number
          total_efectivo: number
          trabajado: boolean
        }[]
      }
      hoy_ar: { Args: Record<PropertyKey, never>; Returns: string }
      ingresos_egresos_mensual: {
        Args: { p_desde: string; p_hasta: string }
        Returns: {
          egresos: number
          ganancia: number
          ingresos: number
          mes: string
          personal: number
        }[]
      }
      marcar_clave_cambiada: { Args: Record<PropertyKey, never>; Returns: undefined }
      personal_del_mes: {
        Args: { p_periodo: string }
        Returns: {
          activo: boolean
          adelanto: number
          aguinaldo: number
          empleado_id: string
          nombre: string
          otro: number
          sueldo: number
          total: number
        }[]
      }
      reabrir_jornada: {
        Args: { p_jornada_id: string }
        Returns: {
          abierta_en: string
          abierta_por: string
          cerrada_en: string | null
          cerrada_por: string | null
          created_at: string
          diferencia_efectivo: number | null
          efectivo_contado: number | null
          estado: Database['public']['Enums']['estado_jornada']
          fecha: string
          fondo_inicial: number
          id: string
          nota_cierre: string | null
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'jornadas'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_auditoria: {
        Args: {
          p_accion: string
          p_antes: Json
          p_despues: Json
          p_registro: string
          p_tabla: string
        }
        Returns: undefined
      }
      registrar_auditoria_servicio: {
        Args: { p_accion: string; p_actor: string; p_despues: Json; p_registro: string }
        Returns: undefined
      }
      registrar_venta: {
        Args: { p_importe: number; p_medio_pago: Database['public']['Enums']['medio_pago'] }
        Returns: {
          anulada: boolean
          anulada_en: string | null
          anulada_por: string | null
          created_at: string
          id: string
          importe: number
          jornada_id: string
          medio_pago: Database['public']['Enums']['medio_pago']
          motivo_anulacion: string | null
          registrada_en: string
          registrada_por: string
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'ventas'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resumen_jornada: {
        Args: { p_jornada_id: string }
        Returns: {
          cantidad_anuladas: number
          cantidad_digital: number
          cantidad_efectivo: number
          cantidad_ventas: number
          diferencia_efectivo: number
          efectivo_contado: number
          efectivo_esperado: number
          estado: Database['public']['Enums']['estado_jornada']
          fecha: string
          fondo_inicial: number
          jornada_id: string
          ticket_promedio: number
          total: number
          total_digital: number
          total_efectivo: number
        }[]
      }
      resumen_periodo: {
        Args: { p_desde: string; p_hasta: string }
        Returns: {
          cantidad_ventas: number
          desde: string
          dias_trabajados: number
          diferencia_caja: number
          hasta: string
          mejor_dia: string
          mejor_dia_total: number
          promedio_diario: number
          ticket_promedio: number
          total: number
          total_digital: number
          total_efectivo: number
        }[]
      }
      usuario_activo: { Args: Record<PropertyKey, never>; Returns: boolean }
      ventas_por_dia_semana: {
        Args: { p_desde: string; p_hasta: string }
        Returns: {
          dia_semana: number
          dias_trabajados: number
          promedio: number
          total: number
        }[]
      }
    }
    Enums: {
      estado_jornada: 'abierta' | 'cerrada'
      medio_pago: 'efectivo' | 'digital'
      rol_usuario: 'cajero' | 'admin'
      tipo_pago_empleado: 'sueldo' | 'adelanto' | 'aguinaldo' | 'otro'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      estado_jornada: ['abierta', 'cerrada'],
      medio_pago: ['efectivo', 'digital'],
      rol_usuario: ['cajero', 'admin'],
      tipo_pago_empleado: ['sueldo', 'adelanto', 'aguinaldo', 'otro'],
    },
  },
} as const
