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
      cobros_mp: {
        Row: {
          created_at: string
          descripcion: string | null
          estado: Database['public']['Enums']['estado_cobro_mp']
          id: string
          id_mp: string
          importe: number
          motivo_descarte: string | null
          pagado_en: string
          pagador: string | null
          resuelto_en: string | null
          resuelto_por: string | null
          tipo: string | null
          updated_at: string
          venta_id: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          descripcion?: string | null
          estado?: Database['public']['Enums']['estado_cobro_mp']
          id?: string
          id_mp: string
          importe: number
          motivo_descarte?: string | null
          pagado_en: string
          pagador?: string | null
          resuelto_en?: string | null
          resuelto_por?: string | null
          tipo?: string | null
          updated_at?: string
          venta_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          estado?: Database['public']['Enums']['estado_cobro_mp']
          id?: string
          id_mp?: string
          importe?: number
          motivo_descarte?: string | null
          pagado_en?: string
          pagador?: string | null
          resuelto_en?: string | null
          resuelto_por?: string | null
          tipo?: string | null
          updated_at?: string
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'cobros_mp_resuelto_por_fkey'
            columns: ['resuelto_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cobros_mp_venta_id_fkey'
            columns: ['venta_id']
            isOneToOne: true
            referencedRelation: 'ventas'
            referencedColumns: ['id']
          },
        ]
      }
      configuracion: {
        Row: {
          created_at: string
          id: string
          mp_automatico: boolean
          tope_confirmacion: number
          unica: boolean
          updated_at: string
          whatsapp_dueno: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          mp_automatico?: boolean
          tope_confirmacion?: number
          unica?: boolean
          updated_at?: string
          whatsapp_dueno?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mp_automatico?: boolean
          tope_confirmacion?: number
          unica?: boolean
          updated_at?: string
          whatsapp_dueno?: string | null
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
          salida_caja_id: string | null
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
          salida_caja_id?: string | null
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
          salida_caja_id?: string | null
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
          {
            foreignKeyName: 'egresos_salida_caja_id_fkey'
            columns: ['salida_caja_id']
            isOneToOne: true
            referencedRelation: 'salidas_caja'
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
      salidas_caja: {
        Row: {
          anulada: boolean
          anulada_en: string | null
          anulada_por: string | null
          created_at: string
          detalle: string | null
          id: string
          importe: number
          jornada_id: string
          motivo: Database['public']['Enums']['motivo_salida']
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
          detalle?: string | null
          id?: string
          importe: number
          jornada_id: string
          motivo: Database['public']['Enums']['motivo_salida']
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
          detalle?: string | null
          id?: string
          importe?: number
          jornada_id?: string
          motivo?: Database['public']['Enums']['motivo_salida']
          motivo_anulacion?: string | null
          registrada_en?: string
          registrada_por?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'salidas_caja_anulada_por_fkey'
            columns: ['anulada_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'salidas_caja_jornada_id_fkey'
            columns: ['jornada_id']
            isOneToOne: false
            referencedRelation: 'jornadas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'salidas_caja_registrada_por_fkey'
            columns: ['registrada_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
        ]
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
          origen: Database['public']['Enums']['origen_venta']
          registrada_en: string
          registrada_por: string | null
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
          origen?: Database['public']['Enums']['origen_venta']
          registrada_en?: string
          registrada_por?: string | null
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
          origen?: Database['public']['Enums']['origen_venta']
          registrada_en?: string
          registrada_por?: string | null
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
      anular_salida: {
        Args: { p_motivo: string; p_salida_id: string }
        Returns: {
          anulada: boolean
          anulada_en: string | null
          anulada_por: string | null
          created_at: string
          detalle: string | null
          id: string
          importe: number
          jornada_id: string
          motivo: Database['public']['Enums']['motivo_salida']
          motivo_anulacion: string | null
          registrada_en: string
          registrada_por: string
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'salidas_caja'
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
          origen: Database['public']['Enums']['origen_venta']
          registrada_en: string
          registrada_por: string | null
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'ventas'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      barrer_mercadopago: { Args: Record<PropertyKey, never>; Returns: undefined }
      cargar_cobro_en_caja: { Args: { p_cobro_id: string }; Returns: boolean }
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
      efectivo_esperado: { Args: { p_jornada_id: string }; Returns: number }
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
      hoy_contra_semana_pasada: {
        Args: Record<PropertyKey, never>
        Returns: {
          hoy: number
          hubo_caja_semana_pasada: boolean
          semana_pasada_a_esta_hora: number
          semana_pasada_total: number
        }[]
      }
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
      registrar_cobro_mp: {
        Args: {
          p_descripcion?: string
          p_id_mp: string
          p_importe: number
          p_pagado_en: string
          p_pagador?: string
          p_tipo?: string
        }
        Returns: {
          created_at: string
          descripcion: string | null
          estado: Database['public']['Enums']['estado_cobro_mp']
          id: string
          id_mp: string
          importe: number
          motivo_descarte: string | null
          pagado_en: string
          pagador: string | null
          resuelto_en: string | null
          resuelto_por: string | null
          tipo: string | null
          updated_at: string
          venta_id: string | null
        }
        SetofOptions: {
          from: '*'
          to: 'cobros_mp'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_salida: {
        Args: {
          p_detalle?: string
          p_importe: number
          p_motivo: Database['public']['Enums']['motivo_salida']
        }
        Returns: {
          anulada: boolean
          anulada_en: string | null
          anulada_por: string | null
          created_at: string
          detalle: string | null
          id: string
          importe: number
          jornada_id: string
          motivo: Database['public']['Enums']['motivo_salida']
          motivo_anulacion: string | null
          registrada_en: string
          registrada_por: string
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'salidas_caja'
          isOneToOne: true
          isSetofReturn: false
        }
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
          origen: Database['public']['Enums']['origen_venta']
          registrada_en: string
          registrada_por: string | null
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'ventas'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolver_cobro_mp: {
        Args: { p_cargar: boolean; p_cobro_id: string; p_motivo?: string }
        Returns: {
          created_at: string
          descripcion: string | null
          estado: Database['public']['Enums']['estado_cobro_mp']
          id: string
          id_mp: string
          importe: number
          motivo_descarte: string | null
          pagado_en: string
          pagador: string | null
          resuelto_en: string | null
          resuelto_por: string | null
          tipo: string | null
          updated_at: string
          venta_id: string | null
        }
        SetofOptions: {
          from: '*'
          to: 'cobros_mp'
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
          cantidad_mercadopago: number
          cantidad_salidas: number
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
          total_mercadopago: number
          total_salidas: number
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
      venta_para_cobro: { Args: { p_importe: number; p_jornada_id: string }; Returns: string }
      ventas_por_dia_semana: {
        Args: { p_desde: string; p_hasta: string }
        Returns: {
          dia_semana: number
          dias_trabajados: number
          promedio: number
          total: number
        }[]
      }
      ventas_por_hora: {
        Args: { p_desde: string; p_hasta: string }
        Returns: {
          dias_trabajados: number
          hora: number
          promedio_cantidad: number
          promedio_total: number
        }[]
      }
    }
    Enums: {
      estado_cobro_mp: 'pendiente' | 'cargado' | 'descartado'
      estado_jornada: 'abierta' | 'cerrada'
      medio_pago: 'efectivo' | 'digital'
      motivo_salida: 'proveedor' | 'retiro' | 'gasto' | 'otro'
      origen_venta: 'manual' | 'mercadopago'
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
      estado_cobro_mp: ['pendiente', 'cargado', 'descartado'],
      estado_jornada: ['abierta', 'cerrada'],
      medio_pago: ['efectivo', 'digital'],
      motivo_salida: ['proveedor', 'retiro', 'gasto', 'otro'],
      origen_venta: ['manual', 'mercadopago'],
      rol_usuario: ['cajero', 'admin'],
      tipo_pago_empleado: ['sueldo', 'adelanto', 'aguinaldo', 'otro'],
    },
  },
} as const
