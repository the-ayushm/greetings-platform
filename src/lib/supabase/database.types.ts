
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "abuse_reports": {
                  Row: {
                    "created_at": string,"details": string,"id": string,"reason": string,"reporter_hash": string | null,"resolution_note": string | null,"resolved_at": string | null,"resolved_by": string | null,"site_id": string | null,"status": string
                  }
                  Insert: {
                    "created_at"?: string,"details"?: string,"id"?: string,"reason": string,"reporter_hash"?: string | null,"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"site_id"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"details"?: string,"id"?: string,"reason"?: string,"reporter_hash"?: string | null,"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"site_id"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "abuse_reports_site_id_fkey"
      columns: ["site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["id"]
    }
                  ]
                },"assets": {
                  Row: {
                    "bytes": number | null,"created_at": string,"declared_bytes": number,"declared_mime": string,"duration_s": number | null,"height": number | null,"id": string,"kind": string,"mime": string | null,"original_name": string,"rejection_reason": string | null,"rights_confirmed_at": string | null,"sha256": string | null,"site_id": string,"status": string,"storage_prefix": string,"updated_at": string,"user_id": string,"variants": NonNullable<Json>,"width": number | null
                  }
                  Insert: {
                    "bytes"?: number | null,"created_at"?: string,"declared_bytes": number,"declared_mime": string,"duration_s"?: number | null,"height"?: number | null,"id"?: string,"kind": string,"mime"?: string | null,"original_name"?: string,"rejection_reason"?: string | null,"rights_confirmed_at"?: string | null,"sha256"?: string | null,"site_id": string,"status"?: string,"storage_prefix": string,"updated_at"?: string,"user_id": string,"variants"?: NonNullable<Json>,"width"?: number | null
                  }
                  Update: {
                    "bytes"?: number | null,"created_at"?: string,"declared_bytes"?: number,"declared_mime"?: string,"duration_s"?: number | null,"height"?: number | null,"id"?: string,"kind"?: string,"mime"?: string | null,"original_name"?: string,"rejection_reason"?: string | null,"rights_confirmed_at"?: string | null,"sha256"?: string | null,"site_id"?: string,"status"?: string,"storage_prefix"?: string,"updated_at"?: string,"user_id"?: string,"variants"?: NonNullable<Json>,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "assets_site_id_fkey"
      columns: ["site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assets_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_role": string,"created_at": string,"id": number,"meta": NonNullable<Json>,"target_id": string | null,"target_type": string | null
                  }
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_role"?: string,"created_at"?: string,"id"?: number,"meta"?: NonNullable<Json>,"target_id"?: string | null,"target_type"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_role"?: string,"created_at"?: string,"id"?: number,"meta"?: NonNullable<Json>,"target_id"?: string | null,"target_type"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"orders": {
                  Row: {
                    "amount_paise": number,"created_at": string,"currency": string,"edit_days": number,"id": string,"last_payment_error": string | null,"live_days": number,"paid_at": string | null,"product_id": string,"razorpay_order_id": string | null,"receipt": string,"refunded_at": string | null,"status": string,"template_key": string,"template_version": number,"updated_at": string,"user_id": string | null
                  }
                  Insert: {
                    "amount_paise": number,"created_at"?: string,"currency": string,"edit_days": number,"id"?: string,"last_payment_error"?: string | null,"live_days": number,"paid_at"?: string | null,"product_id": string,"razorpay_order_id"?: string | null,"receipt": string,"refunded_at"?: string | null,"status"?: string,"template_key": string,"template_version": number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "amount_paise"?: number,"created_at"?: string,"currency"?: string,"edit_days"?: number,"id"?: string,"last_payment_error"?: string | null,"live_days"?: number,"paid_at"?: string | null,"product_id"?: string,"razorpay_order_id"?: string | null,"receipt"?: string,"refunded_at"?: string | null,"status"?: string,"template_key"?: string,"template_version"?: number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_events": {
                  Row: {
                    "attempts": number,"error": string | null,"event_id": string,"event_type": string,"id": string,"processed_at": string | null,"razorpay_order_id": string | null,"razorpay_payment_id": string | null,"razorpay_refund_id": string | null,"received_at": string,"summary": NonNullable<Json>
                  }
                  Insert: {
                    "attempts"?: number,"error"?: string | null,"event_id": string,"event_type": string,"id"?: string,"processed_at"?: string | null,"razorpay_order_id"?: string | null,"razorpay_payment_id"?: string | null,"razorpay_refund_id"?: string | null,"received_at"?: string,"summary"?: NonNullable<Json>
                  }
                  Update: {
                    "attempts"?: number,"error"?: string | null,"event_id"?: string,"event_type"?: string,"id"?: string,"processed_at"?: string | null,"razorpay_order_id"?: string | null,"razorpay_payment_id"?: string | null,"razorpay_refund_id"?: string | null,"received_at"?: string,"summary"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"payments": {
                  Row: {
                    "amount_paise": number,"created_at": string,"currency": string,"error_code": string | null,"error_description": string | null,"id": string,"is_duplicate": boolean,"method": string | null,"order_id": string,"razorpay_payment_id": string,"razorpay_refund_id": string | null,"refund_status": string | null,"refunded_paise": number,"status": string,"updated_at": string
                  }
                  Insert: {
                    "amount_paise": number,"created_at"?: string,"currency": string,"error_code"?: string | null,"error_description"?: string | null,"id"?: string,"is_duplicate"?: boolean,"method"?: string | null,"order_id": string,"razorpay_payment_id": string,"razorpay_refund_id"?: string | null,"refund_status"?: string | null,"refunded_paise"?: number,"status": string,"updated_at"?: string
                  }
                  Update: {
                    "amount_paise"?: number,"created_at"?: string,"currency"?: string,"error_code"?: string | null,"error_description"?: string | null,"id"?: string,"is_duplicate"?: boolean,"method"?: string | null,"order_id"?: string,"razorpay_payment_id"?: string,"razorpay_refund_id"?: string | null,"refund_status"?: string | null,"refunded_paise"?: number,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "created_at": string,"currency": string,"description": string,"edit_days": number,"id": string,"is_active": boolean,"live_days": number,"name": string,"price_paise": number,"template_key": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"currency"?: string,"description"?: string,"edit_days"?: number,"id"?: string,"is_active"?: boolean,"live_days"?: number,"name": string,"price_paise": number,"template_key": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"currency"?: string,"description"?: string,"edit_days"?: number,"id"?: string,"is_active"?: boolean,"live_days"?: number,"name"?: string,"price_paise"?: number,"template_key"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_template_key_fkey"
      columns: ["template_key"]
isOneToOne: false
      referencedRelation: "templates"
      referencedColumns: ["key"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string,"id": string,"role": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"email"?: string,"full_name"?: string,"id": string,"role"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"role"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rate_limits": {
                  Row: {
                    "count": number,"key": string,"window_start": string
                  }
                  Insert: {
                    "count"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "count"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_versions": {
                  Row: {
                    "content": NonNullable<Json>,"created_at": string,"created_by": string | null,"id": string,"schema_version": number,"site_id": string,"version": number
                  }
                  Insert: {
                    "content": NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"schema_version": number,"site_id": string,"version": number
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"schema_version"?: number,"site_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_versions_site_id_fkey"
      columns: ["site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["id"]
    }
                  ]
                },"sites": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"disabled_reason": string | null,"draft_content": NonNullable<Json>,"draft_revision": number,"edit_until": string,"expires_at": string,"first_viewed_at": string | null,"id": string,"order_id": string,"passcode_hash": string | null,"passcode_version": number,"published_at": string | null,"published_version_id": string | null,"slug": string | null,"status": string,"template_key": string,"template_version": number,"updated_at": string,"user_id": string,"view_count": number
                  }
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"disabled_reason"?: string | null,"draft_content": NonNullable<Json>,"draft_revision"?: number,"edit_until": string,"expires_at": string,"first_viewed_at"?: string | null,"id"?: string,"order_id": string,"passcode_hash"?: string | null,"passcode_version"?: number,"published_at"?: string | null,"published_version_id"?: string | null,"slug"?: string | null,"status"?: string,"template_key": string,"template_version": number,"updated_at"?: string,"user_id": string,"view_count"?: number
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"disabled_reason"?: string | null,"draft_content"?: NonNullable<Json>,"draft_revision"?: number,"edit_until"?: string,"expires_at"?: string,"first_viewed_at"?: string | null,"id"?: string,"order_id"?: string,"passcode_hash"?: string | null,"passcode_version"?: number,"published_at"?: string | null,"published_version_id"?: string | null,"slug"?: string | null,"status"?: string,"template_key"?: string,"template_version"?: number,"updated_at"?: string,"user_id"?: string,"view_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "sites_order_id_fkey"
      columns: ["order_id"]
isOneToOne: true
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sites_published_version_fk"
      columns: ["published_version_id"]
isOneToOne: false
      referencedRelation: "site_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"template_versions": {
                  Row: {
                    "default_content": NonNullable<Json>,"is_current": boolean,"notes": string,"released_at": string,"schema_version": number,"template_key": string,"version": number
                  }
                  Insert: {
                    "default_content": NonNullable<Json>,"is_current"?: boolean,"notes"?: string,"released_at"?: string,"schema_version": number,"template_key": string,"version": number
                  }
                  Update: {
                    "default_content"?: NonNullable<Json>,"is_current"?: boolean,"notes"?: string,"released_at"?: string,"schema_version"?: number,"template_key"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "template_versions_template_key_fkey"
      columns: ["template_key"]
isOneToOne: false
      referencedRelation: "templates"
      referencedColumns: ["key"]
    }
                  ]
                },"templates": {
                  Row: {
                    "created_at": string,"description": string,"is_active": boolean,"key": string,"name": string,"sort": number,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"description"?: string,"is_active"?: boolean,"key": string,"name": string,"sort"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"is_active"?: boolean,"key"?: string,"name"?: string,"sort"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "apply_refund":
{ Args: { "p_amount": number,"p_payment_id": string,"p_refund_id": string,"p_status": string }; Returns: Json
                           },
"fulfil_order":
{ Args: { "p_actor"?: string,"p_amount": number,"p_currency": string,"p_method": string,"p_payment_id": string,"p_razorpay_order_id": string }; Returns: Json
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"publish_site":
{ Args: { "p_content": Json,"p_new_slug": string,"p_schema_version": number,"p_site_id": string,"p_user_id": string }; Returns: Json
                           },
"rate_limit_hit":
{ Args: { "p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"record_view":
{ Args: { "p_site_id": string }; Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
