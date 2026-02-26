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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
      activity_log: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          comment_text: string | null
          created_at: string
          field_name: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          organization_id: string
          record_id: string
          record_type: Database["public"]["Enums"]["object_type"]
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          comment_text?: string | null
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          organization_id: string
          record_id: string
          record_type: Database["public"]["Enums"]["object_type"]
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          comment_text?: string | null
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string
          record_id?: string
          record_type?: Database["public"]["Enums"]["object_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_core_activities: {
        Row: {
          checklist_id: string
          core_activity_id: string
          created_at: string
          created_by: string
        }
        Insert: {
          checklist_id: string
          core_activity_id: string
          created_at?: string
          created_by: string
        }
        Update: {
          checklist_id?: string
          core_activity_id?: string
          created_at?: string
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_core_activities_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_core_activities_core_activity_id_fkey"
            columns: ["core_activity_id"]
            isOneToOne: false
            referencedRelation: "core_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_people: {
        Row: {
          checklist_id: string
          created_at: string
          created_by: string
          person_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          created_by: string
          person_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          created_by?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_people_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_processes: {
        Row: {
          checklist_id: string
          created_at: string
          created_by: string
          process_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          created_by: string
          process_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          created_by?: string
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_processes_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_processes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_roles: {
        Row: {
          checklist_id: string
          created_at: string
          created_by: string
          role_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          created_by: string
          role_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          created_by?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_roles_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_software: {
        Row: {
          checklist_id: string
          created_at: string
          created_by: string
          software_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          created_by: string
          software_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          created_by?: string
          software_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_software_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_software_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_subfunctions: {
        Row: {
          checklist_id: string
          created_at: string
          created_by: string
          subfunction_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          created_by: string
          subfunction_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          created_by?: string
          subfunction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_subfunctions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_subfunctions_subfunction_id_fkey"
            columns: ["subfunction_id"]
            isOneToOne: false
            referencedRelation: "subfunctions"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          description: string | null
          end_state: string | null
          id: string
          items: Json | null
          last_reviewed: string | null
          organization_id: string
          status: Database["public"]["Enums"]["document_status"]
          title: string
          trigger: string | null
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_state?: string | null
          id?: string
          items?: Json | null
          last_reviewed?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          trigger?: string | null
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_state?: string | null
          id?: string
          items?: Json | null
          last_reviewed?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          trigger?: string | null
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "checklists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      core_activities: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_state: string | null
          id: string
          organization_id: string
          position: number
          status: Database["public"]["Enums"]["operational_status"]
          subfunction_id: string | null
          title: string
          trigger: string | null
          updated_at: string
          updated_by: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_state?: string | null
          id?: string
          organization_id: string
          position?: number
          status?: Database["public"]["Enums"]["operational_status"]
          subfunction_id?: string | null
          title: string
          trigger?: string | null
          updated_at?: string
          updated_by: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_state?: string | null
          id?: string
          organization_id?: string
          position?: number
          status?: Database["public"]["Enums"]["operational_status"]
          subfunction_id?: string | null
          title?: string
          trigger?: string | null
          updated_at?: string
          updated_by?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_activities_subfunction_id_fkey"
            columns: ["subfunction_id"]
            isOneToOne: false
            referencedRelation: "subfunctions"
            referencedColumns: ["id"]
          },
        ]
      }
      core_activity_people: {
        Row: {
          core_activity_id: string
          created_at: string
          created_by: string
          person_id: string
        }
        Insert: {
          core_activity_id: string
          created_at?: string
          created_by: string
          person_id: string
        }
        Update: {
          core_activity_id?: string
          created_at?: string
          created_by?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_activity_people_core_activity_id_fkey"
            columns: ["core_activity_id"]
            isOneToOne: false
            referencedRelation: "core_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_activity_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      core_activity_roles: {
        Row: {
          core_activity_id: string
          created_at: string
          created_by: string
          role_id: string
        }
        Insert: {
          core_activity_id: string
          created_at?: string
          created_by: string
          role_id: string
        }
        Update: {
          core_activity_id?: string
          created_at?: string
          created_by?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_activity_roles_core_activity_id_fkey"
            columns: ["core_activity_id"]
            isOneToOne: false
            referencedRelation: "core_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_activity_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      core_activity_software: {
        Row: {
          core_activity_id: string
          created_at: string
          created_by: string
          software_id: string
        }
        Insert: {
          core_activity_id: string
          created_at?: string
          created_by: string
          software_id: string
        }
        Update: {
          core_activity_id?: string
          created_at?: string
          created_by?: string
          software_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_activity_software_core_activity_id_fkey"
            columns: ["core_activity_id"]
            isOneToOne: false
            referencedRelation: "core_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "core_activity_software_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_properties: {
        Row: {
          created_at: string
          id: string
          object_type: Database["public"]["Enums"]["object_type"]
          options: Json | null
          organization_id: string
          position: number
          property_name: string
          property_type: Database["public"]["Enums"]["property_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          object_type: Database["public"]["Enums"]["object_type"]
          options?: Json | null
          organization_id: string
          position?: number
          property_name: string
          property_type: Database["public"]["Enums"]["property_type"]
        }
        Update: {
          created_at?: string
          id?: string
          object_type?: Database["public"]["Enums"]["object_type"]
          options?: Json | null
          organization_id?: string
          position?: number
          property_name?: string
          property_type?: Database["public"]["Enums"]["property_type"]
        }
        Relationships: [
          {
            foreignKeyName: "custom_properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_property_values: {
        Row: {
          created_at: string
          custom_property_id: string
          id: string
          record_id: string
          record_type: Database["public"]["Enums"]["object_type"]
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          custom_property_id: string
          id?: string
          record_id: string
          record_type: Database["public"]["Enums"]["object_type"]
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          custom_property_id?: string
          id?: string
          record_id?: string
          record_type?: Database["public"]["Enums"]["object_type"]
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "custom_property_values_custom_property_id_fkey"
            columns: ["custom_property_id"]
            isOneToOne: false
            referencedRelation: "custom_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      function_people: {
        Row: {
          created_at: string
          created_by: string
          function_id: string
          person_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          function_id: string
          person_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          function_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "function_people_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "function_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      function_roles: {
        Row: {
          created_at: string
          created_by: string
          function_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          function_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          function_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "function_roles_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "function_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      function_software: {
        Row: {
          created_at: string
          created_by: string
          function_id: string
          software_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          function_id: string
          software_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          function_id?: string
          software_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "function_software_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "function_software_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      function_workflows: {
        Row: {
          created_at: string
          created_by: string
          function_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          function_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          function_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "function_workflows_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "function_workflows_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      functions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          organization_id: string
          owner_id: string | null
          status: Database["public"]["Enums"]["operational_status"]
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          organization_id: string
          owner_id?: string | null
          status?: Database["public"]["Enums"]["operational_status"]
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          organization_id?: string
          owner_id?: string | null
          status?: Database["public"]["Enums"]["operational_status"]
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_functions_owner"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "functions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      handoff_blocks: {
        Row: {
          created_at: string
          from_phase_id: string | null
          id: string
          label: string
          position: number
          to_phase_id: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string
          from_phase_id?: string | null
          id?: string
          label: string
          position: number
          to_phase_id?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string
          from_phase_id?: string | null
          id?: string
          label?: string
          position?: number
          to_phase_id?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoff_blocks_from_phase_id_fkey"
            columns: ["from_phase_id"]
            isOneToOne: false
            referencedRelation: "workflow_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_blocks_to_phase_id_fkey"
            columns: ["to_phase_id"]
            isOneToOne: false
            referencedRelation: "workflow_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_blocks_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          organization_id: string
          read: boolean
          record_id: string
          record_type: Database["public"]["Enums"]["object_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          organization_id: string
          read?: boolean
          record_id: string
          record_type: Database["public"]["Enums"]["object_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          organization_id?: string
          read?: boolean
          record_id?: string
          record_type?: Database["public"]["Enums"]["object_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          biggest_pains: string | null
          company_description: string | null
          created_at: string
          id: string
          industry: string | null
          key_objectives: string | null
          location: string | null
          name: string
          revenue: number | null
        }
        Insert: {
          biggest_pains?: string | null
          company_description?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          key_objectives?: string | null
          location?: string | null
          name: string
          revenue?: number | null
        }
        Update: {
          biggest_pains?: string | null
          company_description?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          key_objectives?: string | null
          location?: string | null
          name?: string
          revenue?: number | null
        }
        Relationships: []
      }
      persons: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string
          id: string
          job_title: string | null
          last_name: string
          location: string | null
          manager_id: string | null
          mobile_phone: string | null
          organization_id: string
          personal_phone: string | null
          primary_function_id: string | null
          primary_role_id: string | null
          profile_photo_url: string | null
          salary: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
          updated_by: string
          work_arrangement:
            | Database["public"]["Enums"]["work_arrangement"]
            | null
          work_phone: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name: string
          id?: string
          job_title?: string | null
          last_name: string
          location?: string | null
          manager_id?: string | null
          mobile_phone?: string | null
          organization_id: string
          personal_phone?: string | null
          primary_function_id?: string | null
          primary_role_id?: string | null
          profile_photo_url?: string | null
          salary?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
          updated_by: string
          work_arrangement?:
            | Database["public"]["Enums"]["work_arrangement"]
            | null
          work_phone?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string
          location?: string | null
          manager_id?: string | null
          mobile_phone?: string | null
          organization_id?: string
          personal_phone?: string | null
          primary_function_id?: string | null
          primary_role_id?: string | null
          profile_photo_url?: string | null
          salary?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
          updated_by?: string
          work_arrangement?:
            | Database["public"]["Enums"]["work_arrangement"]
            | null
          work_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_persons_primary_role"
            columns: ["primary_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_primary_function_id_fkey"
            columns: ["primary_function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
        ]
      }
      process_core_activities: {
        Row: {
          core_activity_id: string
          created_at: string
          created_by: string
          position: number
          process_id: string
        }
        Insert: {
          core_activity_id: string
          created_at?: string
          created_by: string
          position: number
          process_id: string
        }
        Update: {
          core_activity_id?: string
          created_at?: string
          created_by?: string
          position?: number
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_core_activities_core_activity_id_fkey"
            columns: ["core_activity_id"]
            isOneToOne: false
            referencedRelation: "core_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_core_activities_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_people_involved: {
        Row: {
          created_at: string
          created_by: string
          person_id: string
          process_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          person_id: string
          process_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          person_id?: string
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_people_involved_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_people_involved_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_roles_involved: {
        Row: {
          created_at: string
          created_by: string
          process_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          process_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          process_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_roles_involved_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_roles_involved_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      process_software: {
        Row: {
          created_at: string
          created_by: string
          process_id: string
          software_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          process_id: string
          software_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          process_id?: string
          software_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_software_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_software_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      process_subfunctions: {
        Row: {
          created_at: string
          created_by: string
          process_id: string
          subfunction_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          process_id: string
          subfunction_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          process_id?: string
          subfunction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_subfunctions_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_subfunctions_subfunction_id_fkey"
            columns: ["subfunction_id"]
            isOneToOne: false
            referencedRelation: "subfunctions"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_state: string | null
          estimated_duration: string | null
          id: string
          last_revised: string | null
          organization_id: string
          owner_person_id: string | null
          owner_role_id: string | null
          status: Database["public"]["Enums"]["operational_status"]
          title: string
          trigger: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_state?: string | null
          estimated_duration?: string | null
          id?: string
          last_revised?: string | null
          organization_id: string
          owner_person_id?: string | null
          owner_role_id?: string | null
          status?: Database["public"]["Enums"]["operational_status"]
          title: string
          trigger?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_state?: string | null
          estimated_duration?: string | null
          id?: string
          last_revised?: string | null
          organization_id?: string
          owner_person_id?: string | null
          owner_role_id?: string | null
          status?: Database["public"]["Enums"]["operational_status"]
          title?: string
          trigger?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_owner_role_id_fkey"
            columns: ["owner_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          location?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_people: {
        Row: {
          created_at: string
          created_by: string
          person_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          person_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          person_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_people_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_subfunctions: {
        Row: {
          created_at: string
          created_by: string
          role_id: string
          subfunction_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          role_id: string
          subfunction_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          role_id?: string
          subfunction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_subfunctions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_subfunctions_subfunction_id_fkey"
            columns: ["subfunction_id"]
            isOneToOne: false
            referencedRelation: "subfunctions"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          brief_description: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          job_description: string | null
          organization_id: string
          primary_function_id: string | null
          status: Database["public"]["Enums"]["role_status"]
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          brief_description?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          job_description?: string | null
          organization_id: string
          primary_function_id?: string | null
          status?: Database["public"]["Enums"]["role_status"]
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          brief_description?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          job_description?: string | null
          organization_id?: string
          primary_function_id?: string | null
          status?: Database["public"]["Enums"]["role_status"]
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_primary_function_id_fkey"
            columns: ["primary_function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
        ]
      }
      software: {
        Row: {
          annual_cost: number | null
          billing_cycle: Database["public"]["Enums"]["billing_cycle"] | null
          category: string[] | null
          created_at: string
          created_by: string
          current_discount: string | null
          description: string | null
          id: string
          monthly_cost: number | null
          number_of_seats: number | null
          organization_id: string
          pricing_model: Database["public"]["Enums"]["pricing_model"] | null
          renewal_date: string | null
          status: Database["public"]["Enums"]["software_status"]
          title: string
          updated_at: string
          updated_by: string
          url: string | null
        }
        Insert: {
          annual_cost?: number | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          category?: string[] | null
          created_at?: string
          created_by: string
          current_discount?: string | null
          description?: string | null
          id?: string
          monthly_cost?: number | null
          number_of_seats?: number | null
          organization_id: string
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          renewal_date?: string | null
          status?: Database["public"]["Enums"]["software_status"]
          title: string
          updated_at?: string
          updated_by: string
          url?: string | null
        }
        Update: {
          annual_cost?: number | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          category?: string[] | null
          created_at?: string
          created_by?: string
          current_discount?: string | null
          description?: string | null
          id?: string
          monthly_cost?: number | null
          number_of_seats?: number | null
          organization_id?: string
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          renewal_date?: string | null
          status?: Database["public"]["Enums"]["software_status"]
          title?: string
          updated_at?: string
          updated_by?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "software_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      software_people: {
        Row: {
          created_at: string
          created_by: string
          person_id: string
          software_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          person_id: string
          software_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          person_id?: string
          software_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "software_people_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      software_roles: {
        Row: {
          created_at: string
          created_by: string
          role_id: string
          software_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          role_id: string
          software_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          role_id?: string
          software_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "software_roles_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_core_activities: {
        Row: {
          core_activity_id: string
          created_at: string
          created_by: string
          sop_id: string
        }
        Insert: {
          core_activity_id: string
          created_at?: string
          created_by: string
          sop_id: string
        }
        Update: {
          core_activity_id?: string
          created_at?: string
          created_by?: string
          sop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_core_activities_core_activity_id_fkey"
            columns: ["core_activity_id"]
            isOneToOne: false
            referencedRelation: "core_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_core_activities_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_functions: {
        Row: {
          created_at: string
          created_by: string
          function_id: string
          sop_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          function_id: string
          sop_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          function_id?: string
          sop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_functions_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_functions_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_people: {
        Row: {
          created_at: string
          created_by: string
          person_id: string
          sop_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          person_id: string
          sop_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          person_id?: string
          sop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_people_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_processes: {
        Row: {
          created_at: string
          created_by: string
          process_id: string
          sop_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          process_id: string
          sop_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          process_id?: string
          sop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_processes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_processes_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_roles: {
        Row: {
          created_at: string
          created_by: string
          role_id: string
          sop_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          role_id: string
          sop_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          role_id?: string
          sop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_roles_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_software: {
        Row: {
          created_at: string
          created_by: string
          software_id: string
          sop_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          software_id: string
          sop_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          software_id?: string
          sop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_software_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_software_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_subfunctions: {
        Row: {
          created_at: string
          created_by: string
          sop_id: string
          subfunction_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          sop_id: string
          subfunction_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          sop_id?: string
          subfunction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_subfunctions_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_subfunctions_subfunction_id_fkey"
            columns: ["subfunction_id"]
            isOneToOne: false
            referencedRelation: "subfunctions"
            referencedColumns: ["id"]
          },
        ]
      }
      sops: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          description: string | null
          end_state: string | null
          id: string
          last_reviewed: string | null
          organization_id: string
          status: Database["public"]["Enums"]["document_status"]
          title: string
          trigger: string | null
          updated_at: string
          updated_by: string
          version: number
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_state?: string | null
          id?: string
          last_reviewed?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          trigger?: string | null
          updated_at?: string
          updated_by: string
          version?: number
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_state?: string | null
          id?: string
          last_reviewed?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          trigger?: string | null
          updated_at?: string
          updated_by?: string
          version?: number
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subfunction_people: {
        Row: {
          created_at: string
          created_by: string
          person_id: string
          subfunction_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          person_id: string
          subfunction_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          person_id?: string
          subfunction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subfunction_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subfunction_people_subfunction_id_fkey"
            columns: ["subfunction_id"]
            isOneToOne: false
            referencedRelation: "subfunctions"
            referencedColumns: ["id"]
          },
        ]
      }
      subfunction_processes: {
        Row: {
          created_at: string
          created_by: string
          process_id: string
          subfunction_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          process_id: string
          subfunction_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          process_id?: string
          subfunction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subfunction_processes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subfunction_processes_subfunction_id_fkey"
            columns: ["subfunction_id"]
            isOneToOne: false
            referencedRelation: "subfunctions"
            referencedColumns: ["id"]
          },
        ]
      }
      subfunction_roles: {
        Row: {
          created_at: string
          created_by: string
          role_id: string
          subfunction_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          role_id: string
          subfunction_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          role_id?: string
          subfunction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subfunction_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subfunction_roles_subfunction_id_fkey"
            columns: ["subfunction_id"]
            isOneToOne: false
            referencedRelation: "subfunctions"
            referencedColumns: ["id"]
          },
        ]
      }
      subfunction_software: {
        Row: {
          created_at: string
          created_by: string
          software_id: string
          subfunction_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          software_id: string
          subfunction_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          software_id?: string
          subfunction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subfunction_software_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subfunction_software_subfunction_id_fkey"
            columns: ["subfunction_id"]
            isOneToOne: false
            referencedRelation: "subfunctions"
            referencedColumns: ["id"]
          },
        ]
      }
      subfunctions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          function_id: string
          id: string
          organization_id: string
          owner_id: string | null
          position: number
          status: Database["public"]["Enums"]["operational_status"]
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          function_id: string
          id?: string
          organization_id: string
          owner_id?: string | null
          position?: number
          status?: Database["public"]["Enums"]["operational_status"]
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          function_id?: string
          id?: string
          organization_id?: string
          owner_id?: string | null
          position?: number
          status?: Database["public"]["Enums"]["operational_status"]
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_subfunctions_owner"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subfunctions_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subfunctions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      template_checklists: {
        Row: {
          checklist_id: string
          created_at: string
          created_by: string
          template_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          created_by: string
          template_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          created_by?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_checklists_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_core_activities: {
        Row: {
          core_activity_id: string
          created_at: string
          created_by: string
          template_id: string
        }
        Insert: {
          core_activity_id: string
          created_at?: string
          created_by: string
          template_id: string
        }
        Update: {
          core_activity_id?: string
          created_at?: string
          created_by?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_core_activities_core_activity_id_fkey"
            columns: ["core_activity_id"]
            isOneToOne: false
            referencedRelation: "core_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_core_activities_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_processes: {
        Row: {
          created_at: string
          created_by: string
          process_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          process_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          process_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_processes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_processes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_roles: {
        Row: {
          created_at: string
          created_by: string
          role_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          role_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          role_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_roles_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_software: {
        Row: {
          created_at: string
          created_by: string
          software_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          software_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          software_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_software_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_software_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_sops: {
        Row: {
          created_at: string
          created_by: string
          sop_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          sop_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          sop_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_sops_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_sops_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_subfunctions: {
        Row: {
          created_at: string
          created_by: string
          subfunction_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          subfunction_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          subfunction_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_subfunctions_subfunction_id_fkey"
            columns: ["subfunction_id"]
            isOneToOne: false
            referencedRelation: "subfunctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_subfunctions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          last_reviewed: string | null
          location_url: string | null
          organization_id: string
          responsible_person_id: string | null
          responsible_role_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          type: string | null
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          last_reviewed?: string | null
          location_url?: string | null
          organization_id: string
          responsible_person_id?: string | null
          responsible_role_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          type?: string | null
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          last_reviewed?: string | null
          location_url?: string | null
          organization_id?: string
          responsible_person_id?: string | null
          responsible_role_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          type?: string | null
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_responsible_role_id_fkey"
            columns: ["responsible_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_phase_processes: {
        Row: {
          created_at: string
          created_by: string
          phase_id: string
          position: number
          process_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          phase_id: string
          position: number
          process_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          phase_id?: string
          position?: number
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_phase_processes_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "workflow_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_phase_processes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_phases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          position: number
          status: Database["public"]["Enums"]["operational_status"]
          title: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          position: number
          status?: Database["public"]["Enums"]["operational_status"]
          title: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["operational_status"]
          title?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_phases_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          organization_id: string
          status: string
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          organization_id: string
          status?: string
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          organization_id?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      activity_action:
        | "created"
        | "updated"
        | "status_changed"
        | "association_added"
        | "association_removed"
        | "comment"
        | "deleted"
      billing_cycle: "Monthly" | "Annual"
      document_status:
        | "Draft"
        | "In Review"
        | "Published"
        | "Needs Update"
        | "Archived"
      object_type:
        | "function"
        | "subfunction"
        | "process"
        | "core_activity"
        | "person"
        | "role"
        | "software"
        | "sop"
        | "checklist"
        | "template"
      operational_status:
        | "Draft"
        | "In Review"
        | "Active"
        | "Needs Update"
        | "Archived"
      org_role: "admin" | "member"
      person_status: "Active" | "Inactive"
      pricing_model: "Per Seat" | "Flat Rate" | "Usage-Based" | "Tiered"
      property_type:
        | "text"
        | "number"
        | "date"
        | "select"
        | "multi_select"
        | "url"
        | "email"
        | "phone"
        | "currency"
        | "boolean"
      role_status: "Active" | "Inactive" | "Open"
      software_status: "Active" | "Under Evaluation" | "Deprecated"
      work_arrangement: "In-Person" | "Remote" | "Hybrid"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_action: [
        "created",
        "updated",
        "status_changed",
        "association_added",
        "association_removed",
        "comment",
        "deleted",
      ],
      billing_cycle: ["Monthly", "Annual"],
      document_status: [
        "Draft",
        "In Review",
        "Published",
        "Needs Update",
        "Archived",
      ],
      object_type: [
        "function",
        "subfunction",
        "process",
        "core_activity",
        "person",
        "role",
        "software",
        "sop",
        "checklist",
        "template",
      ],
      operational_status: [
        "Draft",
        "In Review",
        "Active",
        "Needs Update",
        "Archived",
      ],
      org_role: ["admin", "member"],
      person_status: ["Active", "Inactive"],
      pricing_model: ["Per Seat", "Flat Rate", "Usage-Based", "Tiered"],
      property_type: [
        "text",
        "number",
        "date",
        "select",
        "multi_select",
        "url",
        "email",
        "phone",
        "currency",
        "boolean",
      ],
      role_status: ["Active", "Inactive", "Open"],
      software_status: ["Active", "Under Evaluation", "Deprecated"],
      work_arrangement: ["In-Person", "Remote", "Hybrid"],
    },
  },
} as const
