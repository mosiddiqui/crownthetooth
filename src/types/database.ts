// Database types generated from the schema
// These types match the Supabase database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type UserRole = 'owner' | 'admin' | 'manager' | 'employee'
export type EmploymentType = 'full-time' | 'part-time' | 'prn' | 'contractor'
export type Classification = 'exempt' | 'non-exempt'
export type EmployeeStatus = 'active' | 'inactive' | 'terminated' | 'loa'
export type ProbationStatus = 'in_progress' | 'passed' | 'extended' | 'failed'
export type DisciplineStatus = 'clean' | 'verbal' | 'written' | 'final'
export type PayType = 'hourly' | 'salary' | 'production'
export type DocumentStatus = 'pending' | 'sent' | 'viewed' | 'signed' | 'expired'
export type LicenseStatus = 'current' | 'expiring_soon' | 'urgent' | 'expired'
export type ReviewType = '30_day' | '60_day' | '90_day' | 'quarterly' | 'annual' | 'pip'
export type ReviewStatus = 'scheduled' | 'in_progress' | 'pending_employee' | 'pending_review' | 'complete' | 'overdue'
export type DisciplineLevel = 'coaching' | 'verbal' | 'written' | 'final' | 'termination'
export type DisciplineCategory = 'attendance' | 'conduct' | 'performance' | 'policy_violation' | 'gossip'
export type AttendanceStatus = 'present' | 'absent' | 'tardy' | 'left_early' | 'partial'
export type AbsenceType = 'sick' | 'pto' | 'no_call' | 'excused' | 'unexcused' | 'bereavement' | 'jury_duty' | 'fmla'
export type PTOType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'unpaid' | 'other'
export type PTOStatus = 'pending' | 'approved' | 'denied' | 'cancelled' | 'withdrawn'
export type TrainingStatus = 'assigned' | 'in_progress' | 'complete' | 'overdue' | 'waived'
export type OnboardingStatus = 'not_started' | 'in_progress' | 'complete' | 'overdue'
export type SeparationType = 'resignation' | 'termination' | 'layoff' | 'retirement' | 'job_abandonment'
export type RehireEligibility = 'yes' | 'no' | 'with_conditions'
export type SubscriptionTier = 'basic' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trial'

// Database table types
export interface Organization {
  id: string
  name: string
  dba_name: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  settings: Json
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string | null
  auth_user_id: string | null
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  permissions: Json
  avatar_url: string | null
  last_login: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Position {
  id: string
  organization_id: string | null
  position_id: string | null
  title: string
  department: string | null
  reports_to: string | null
  classification: Classification | null
  employment_type: EmploymentType | null
  pay_range_min: number | null
  pay_range_max: number | null
  summary: string | null
  essential_functions: string | null
  required_qualifications: string | null
  preferred_qualifications: string | null
  physical_requirements: string | null
  working_conditions: string | null
  licenses_required: string[] | null
  kpis: Json | null
  onboarding_template_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  organization_id: string | null
  user_id: string | null
  employee_id: string | null
  first_name: string
  last_name: string
  preferred_name: string | null
  personal_email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  date_of_birth: string | null
  ssn_last_four: string | null
  emergency_contact_name: string | null
  emergency_contact_relationship: string | null
  emergency_contact_phone: string | null
  position_id: string | null
  department: string | null
  reports_to: string | null
  employment_type: EmploymentType | null
  classification: Classification | null
  hire_date: string
  probation_end_date: string | null
  probation_status: ProbationStatus
  termination_date: string | null
  pay_rate: number | null
  pay_type: PayType | null
  last_raise_date: string | null
  status: EmployeeStatus
  discipline_status: DisciplineStatus
  pto_balance_hours: number
  attendance_points: number
  points_last_reset: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OnboardingTemplate {
  id: string
  organization_id: string | null
  position_id: string | null
  name: string
  description: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OnboardingTemplateTask {
  id: string
  template_id: string | null
  category: string | null
  task_number: string | null
  title: string
  description: string | null
  responsible_party: string | null
  resource_url: string | null
  time_estimate: string | null
  is_required: boolean
  verification_method: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface EmployeeOnboarding {
  id: string
  employee_id: string | null
  template_id: string | null
  start_date: string | null
  target_completion_date: string | null
  actual_completion_date: string | null
  status: OnboardingStatus
  assigned_mentor_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EmployeeOnboardingTask {
  id: string
  employee_onboarding_id: string | null
  template_task_id: string | null
  is_complete: boolean
  completed_date: string | null
  completed_by: string | null
  notes: string | null
  created_at: string
}

export interface DocumentTemplate {
  id: string
  organization_id: string | null
  name: string
  type: string | null
  content: string | null
  variables: Json | null
  requires_signature: boolean
  signature_fields: Json | null
  version: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmployeeDocument {
  id: string
  employee_id: string | null
  template_id: string | null
  document_type: string
  document_name: string
  version: string | null
  file_url: string | null
  status: DocumentStatus
  date_sent: string | null
  date_viewed: string | null
  date_signed: string | null
  expiration_date: string | null
  signature_data: Json | null
  signed_by_employee: boolean
  signed_by_witness: boolean
  witness_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface License {
  id: string
  employee_id: string | null
  license_type: string
  license_number: string | null
  issuing_authority: string | null
  issue_date: string | null
  expiration_date: string | null
  status: LicenseStatus
  ce_hours_required: number
  ce_hours_completed: number
  verification_url: string | null
  document_url: string | null
  last_reminder_sent: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PerformanceReview {
  id: string
  employee_id: string | null
  reviewer_id: string | null
  review_type: ReviewType | null
  period_start: string | null
  period_end: string | null
  scheduled_date: string | null
  actual_date: string | null
  status: ReviewStatus
  overall_rating: number | null
  job_knowledge_score: number | null
  quality_score: number | null
  productivity_score: number | null
  communication_score: number | null
  teamwork_score: number | null
  attendance_score: number | null
  initiative_score: number | null
  strengths: string | null
  areas_for_improvement: string | null
  goals_set: string | null
  employee_comments: string | null
  reviewer_comments: string | null
  raise_recommended: boolean
  raise_percentage: number | null
  raise_amount: number | null
  raise_effective_date: string | null
  promotion_recommended: boolean
  promotion_to_position_id: string | null
  document_url: string | null
  employee_signed: boolean
  employee_signed_date: string | null
  reviewer_signed: boolean
  reviewer_signed_date: string | null
  next_review_date: string | null
  created_at: string
  updated_at: string
}

export interface PerformanceMetric {
  id: string
  employee_id: string | null
  metric_period: string | null
  period_start: string | null
  period_end: string | null
  metrics: Json
  overall_rating: string | null
  manager_notes: string | null
  created_at: string
  updated_at: string
}

export interface DisciplineIncident {
  id: string
  employee_id: string | null
  incident_id: string | null
  incident_date: string
  report_date: string | null
  reported_by: string | null
  category: DisciplineCategory | null
  incident_type: string | null
  description: string
  policy_violated: string | null
  discipline_level: DisciplineLevel | null
  prior_incidents_count: number
  action_taken: string | null
  improvement_required: string | null
  timeline: string | null
  follow_up_date: string | null
  follow_up_complete: boolean
  outcome: string | null
  points_assessed: number
  witness_id: string | null
  witness_name: string | null
  employee_acknowledged: boolean
  acknowledge_date: string | null
  employee_refused_to_sign: boolean
  document_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  employee_id: string | null
  date: string
  scheduled_start: string | null
  scheduled_end: string | null
  actual_start: string | null
  actual_end: string | null
  scheduled_hours: number | null
  actual_hours: number | null
  status: AttendanceStatus
  absence_type: AbsenceType | null
  call_out_time: string | null
  call_out_method: string | null
  confirmed_by: string | null
  documentation_required: boolean
  documentation_received: boolean
  coverage_found: boolean | null
  coverage_by: string | null
  points_assessed: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PTORequest {
  id: string
  employee_id: string | null
  request_id: string | null
  request_date: string
  start_date: string
  end_date: string
  total_hours: number | null
  total_days: number | null
  pto_type: PTOType | null
  reason: string | null
  status: PTOStatus
  reviewed_by: string | null
  review_date: string | null
  denial_reason: string | null
  coverage_arranged: boolean
  coverage_by: string | null
  coverage_notes: string | null
  balance_before: number | null
  balance_after: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TrainingCourse {
  id: string
  organization_id: string | null
  name: string
  category: string | null
  description: string | null
  is_required: boolean
  required_for_positions: string[] | null
  frequency: string | null
  duration_hours: number | null
  ce_credits: number
  provider: string | null
  cost: number
  content_url: string | null
  passing_score: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmployeeTraining {
  id: string
  employee_id: string | null
  course_id: string | null
  assigned_by: string | null
  assigned_date: string
  due_date: string | null
  start_date: string | null
  completion_date: string | null
  status: TrainingStatus
  score: number | null
  passed: boolean | null
  attempts: number
  certificate_url: string | null
  expiration_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Offboarding {
  id: string
  employee_id: string | null
  separation_type: SeparationType | null
  termination_reason: string | null
  is_voluntary: boolean | null
  notice_date: string | null
  last_work_date: string | null
  notice_period_days: number | null
  notice_period_met: boolean | null
  eligible_for_rehire: RehireEligibility | null
  rehire_conditions: string | null
  exit_interview_scheduled: string | null
  exit_interview_completed: boolean
  exit_interview_date: string | null
  exit_interview_conducted_by: string | null
  exit_interview_notes: string | null
  departure_reason: string | null
  would_recommend: boolean | null
  feedback: string | null
  final_paycheck_date: string | null
  pto_payout_hours: number | null
  pto_payout_amount: number | null
  other_payments: number | null
  deductions: string | null
  keys_returned: boolean
  keys_returned_date: string | null
  badge_returned: boolean
  badge_returned_date: string | null
  uniforms_returned: boolean
  uniforms_returned_date: string | null
  equipment_returned: boolean
  equipment_returned_date: string | null
  equipment_list: string | null
  equipment_notes: string | null
  system_access_revoked: boolean
  system_access_revoked_date: string | null
  system_access_revoked_by: string | null
  email_forwarded_to: string | null
  offboarding_complete: boolean
  completed_by: string | null
  completion_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PTOSettings {
  id: string
  organization_id: string | null
  accrual_start_months: number
  annual_pto_hours: number
  max_carryover_hours: number
  accrual_method: string
  pto_year_start_month: number
  blackout_dates: Json
  require_advance_notice_days: number
  max_consecutive_days: number
  created_at: string
  updated_at: string
}

export interface AttendanceSettings {
  id: string
  organization_id: string | null
  tardiness_points: number
  left_early_points: number
  no_coverage_points: number
  unexcused_absence_points: number
  no_call_no_show_points: number
  rolling_period_days: number
  verbal_warning_threshold: number
  written_warning_threshold: number
  final_warning_threshold: number
  termination_threshold: number
  grace_period_minutes: number
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  organization_id: string | null
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  description: string | null
  old_values: Json | null
  new_values: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface Notification {
  id: string
  organization_id: string | null
  user_id: string | null
  type: string | null
  priority: string
  title: string | null
  message: string | null
  link: string | null
  metadata: Json
  is_read: boolean
  read_at: string | null
  is_email_sent: boolean
  email_sent_at: string | null
  created_at: string
}

export interface ScheduledReview {
  id: string
  organization_id: string | null
  employee_id: string | null
  review_type: string
  scheduled_date: string
  status: string
  created_review_id: string | null
  created_at: string
  updated_at: string
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      positions: {
        Row: Position
        Insert: Omit<Position, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Position, 'id' | 'created_at' | 'updated_at'>>
      }
      employees: {
        Row: Employee
        Insert: Omit<Employee, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at'>>
      }
      onboarding_templates: {
        Row: OnboardingTemplate
        Insert: Omit<OnboardingTemplate, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<OnboardingTemplate, 'id' | 'created_at' | 'updated_at'>>
      }
      onboarding_template_tasks: {
        Row: OnboardingTemplateTask
        Insert: Omit<OnboardingTemplateTask, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<OnboardingTemplateTask, 'id' | 'created_at' | 'updated_at'>>
      }
      employee_onboarding: {
        Row: EmployeeOnboarding
        Insert: Omit<EmployeeOnboarding, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<EmployeeOnboarding, 'id' | 'created_at' | 'updated_at'>>
      }
      employee_onboarding_tasks: {
        Row: EmployeeOnboardingTask
        Insert: Omit<EmployeeOnboardingTask, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<EmployeeOnboardingTask, 'id' | 'created_at'>>
      }
      document_templates: {
        Row: DocumentTemplate
        Insert: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at'>>
      }
      employee_documents: {
        Row: EmployeeDocument
        Insert: Omit<EmployeeDocument, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<EmployeeDocument, 'id' | 'created_at' | 'updated_at'>>
      }
      licenses: {
        Row: License
        Insert: Omit<License, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<License, 'id' | 'created_at' | 'updated_at'>>
      }
      performance_reviews: {
        Row: PerformanceReview
        Insert: Omit<PerformanceReview, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<PerformanceReview, 'id' | 'created_at' | 'updated_at'>>
      }
      performance_metrics: {
        Row: PerformanceMetric
        Insert: Omit<PerformanceMetric, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<PerformanceMetric, 'id' | 'created_at' | 'updated_at'>>
      }
      discipline_incidents: {
        Row: DisciplineIncident
        Insert: Omit<DisciplineIncident, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<DisciplineIncident, 'id' | 'created_at' | 'updated_at'>>
      }
      attendance_records: {
        Row: AttendanceRecord
        Insert: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>>
      }
      pto_requests: {
        Row: PTORequest
        Insert: Omit<PTORequest, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<PTORequest, 'id' | 'created_at' | 'updated_at'>>
      }
      training_courses: {
        Row: TrainingCourse
        Insert: Omit<TrainingCourse, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<TrainingCourse, 'id' | 'created_at' | 'updated_at'>>
      }
      employee_training: {
        Row: EmployeeTraining
        Insert: Omit<EmployeeTraining, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<EmployeeTraining, 'id' | 'created_at' | 'updated_at'>>
      }
      offboarding: {
        Row: Offboarding
        Insert: Omit<Offboarding, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Offboarding, 'id' | 'created_at' | 'updated_at'>>
      }
      pto_settings: {
        Row: PTOSettings
        Insert: Omit<PTOSettings, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<PTOSettings, 'id' | 'created_at' | 'updated_at'>>
      }
      attendance_settings: {
        Row: AttendanceSettings
        Insert: Omit<AttendanceSettings, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<AttendanceSettings, 'id' | 'created_at' | 'updated_at'>>
      }
      audit_log: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<AuditLog, 'id' | 'created_at'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
      }
      scheduled_reviews: {
        Row: ScheduledReview
        Insert: Omit<ScheduledReview, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<ScheduledReview, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Views: Record<string, never>
    Functions: {
      user_organization_id: {
        Args: Record<string, never>
        Returns: string
      }
      user_role: {
        Args: Record<string, never>
        Returns: string
      }
      is_admin_or_owner: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}

// Extended types with relations for client-side use
export interface EmployeeWithRelations extends Employee {
  position?: Position | null
  user?: User | null
  manager?: Employee | null
  organization?: Organization | null
}

export interface UserWithRelations extends User {
  organization?: Organization | null
  employee?: Employee | null
}

export interface PerformanceReviewWithRelations extends PerformanceReview {
  employee?: Employee | null
  reviewer?: User | null
  promotion_to_position?: Position | null
}

export interface PTORequestWithRelations extends PTORequest {
  employee?: Employee | null
  reviewed_by_user?: User | null
  coverage_employee?: Employee | null
}

export interface AttendanceRecordWithRelations extends AttendanceRecord {
  employee?: Employee | null
  confirmed_by_user?: User | null
  coverage_employee?: Employee | null
}

export interface DisciplineIncidentWithRelations extends DisciplineIncident {
  employee?: Employee | null
  reported_by_user?: User | null
  witness?: User | null
}

export interface LicenseWithRelations extends License {
  employee?: Employee | null
}

export interface EmployeeDocumentWithRelations extends EmployeeDocument {
  employee?: Employee | null
  template?: DocumentTemplate | null
  witness?: User | null
}

export interface EmployeeTrainingWithRelations extends EmployeeTraining {
  employee?: Employee | null
  course?: TrainingCourse | null
  assigned_by_user?: User | null
}

export interface EmployeeOnboardingWithRelations extends EmployeeOnboarding {
  employee?: Employee | null
  template?: OnboardingTemplate | null
  mentor?: Employee | null
  tasks?: EmployeeOnboardingTask[]
}

export interface NotificationWithRelations extends Notification {
  user?: User | null
}
