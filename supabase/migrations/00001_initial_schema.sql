-- =============================================
-- DentalOS HR Database Schema
-- Multi-tenant HR Management System for Dental Practices
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ORGANIZATION (Multi-tenant support)
-- =============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  dba_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
  subscription_status VARCHAR(50) DEFAULT 'active',
  settings JSONB DEFAULT '{}', -- practice-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USERS (Authentication & Access)
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE, -- Supabase Auth user ID
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'employee', -- owner, admin, manager, employee
  permissions JSONB DEFAULT '{}',
  avatar_url TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- POSITIONS (Tab 2: Job Descriptions)
-- Must be created before employees due to foreign key
-- =============================================
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  position_id VARCHAR(50), -- POS-DA-001 format
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  reports_to VARCHAR(255),
  classification VARCHAR(50), -- exempt, non-exempt
  employment_type VARCHAR(50),
  pay_range_min DECIMAL(10,2),
  pay_range_max DECIMAL(10,2),
  summary TEXT,
  essential_functions TEXT,
  required_qualifications TEXT,
  preferred_qualifications TEXT,
  physical_requirements TEXT,
  working_conditions TEXT,
  licenses_required TEXT[],
  kpis JSONB, -- role-specific metrics
  onboarding_template_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EMPLOYEES (Tab 1: Employee Roster)
-- =============================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- links to login
  employee_id VARCHAR(50), -- SMT-001 format
  
  -- Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  preferred_name VARCHAR(100),
  personal_email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  date_of_birth DATE,
  ssn_last_four VARCHAR(4), -- encrypted
  
  -- Emergency Contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_relationship VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  
  -- Employment Info
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  department VARCHAR(100),
  reports_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  employment_type VARCHAR(50), -- full-time, part-time, prn, contractor
  classification VARCHAR(50), -- exempt, non-exempt
  hire_date DATE NOT NULL,
  probation_end_date DATE,
  probation_status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, passed, extended, failed
  termination_date DATE,
  
  -- Compensation
  pay_rate DECIMAL(10,2),
  pay_type VARCHAR(50), -- hourly, salary, production
  last_raise_date DATE,
  
  -- Status & Tracking
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, terminated, loa
  discipline_status VARCHAR(50) DEFAULT 'clean', -- clean, verbal, written, final
  pto_balance_hours DECIMAL(5,2) DEFAULT 0,
  attendance_points DECIMAL(4,1) DEFAULT 0,
  points_last_reset DATE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for positions.onboarding_template_id after onboarding_templates is created
-- ALTER TABLE positions ADD CONSTRAINT fk_positions_onboarding_template 
--   FOREIGN KEY (onboarding_template_id) REFERENCES onboarding_templates(id);

-- =============================================
-- ONBOARDING TEMPLATES (Tabs 3 & 4: Tracker + Checklists)
-- =============================================
CREATE TABLE onboarding_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add the foreign key constraint
ALTER TABLE positions ADD CONSTRAINT fk_positions_onboarding_template 
  FOREIGN KEY (onboarding_template_id) REFERENCES onboarding_templates(id) ON DELETE SET NULL;

CREATE TABLE onboarding_template_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  category VARCHAR(100), -- day_1, week_1, week_2, 30_day, 60_day, 90_day
  task_number VARCHAR(20),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  responsible_party VARCHAR(100), -- hr, manager, employee, it
  resource_url TEXT,
  time_estimate VARCHAR(50),
  is_required BOOLEAN DEFAULT true,
  verification_method VARCHAR(100), -- signature, quiz, observation, system_check
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE employee_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES onboarding_templates(id) ON DELETE SET NULL,
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, complete, overdue
  assigned_mentor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE employee_onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_onboarding_id UUID REFERENCES employee_onboarding(id) ON DELETE CASCADE,
  template_task_id UUID REFERENCES onboarding_template_tasks(id) ON DELETE SET NULL,
  is_complete BOOLEAN DEFAULT false,
  completed_date DATE,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DOCUMENTS (Tab 5: Contracts & Agreements)
-- =============================================
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100), -- offer_letter, handbook, nda, hipaa, w4, i9, etc.
  content TEXT, -- HTML/Markdown template with variables
  variables JSONB, -- available merge fields
  requires_signature BOOLEAN DEFAULT false,
  signature_fields JSONB, -- signature placement info
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  version VARCHAR(20),
  file_url TEXT, -- stored document
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, viewed, signed, expired
  date_sent TIMESTAMP WITH TIME ZONE,
  date_viewed TIMESTAMP WITH TIME ZONE,
  date_signed TIMESTAMP WITH TIME ZONE,
  expiration_date DATE,
  signature_data JSONB, -- signature info
  signed_by_employee BOOLEAN DEFAULT false,
  signed_by_witness BOOLEAN DEFAULT false,
  witness_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- LICENSES & CERTIFICATIONS (Tab 6)
-- =============================================
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  license_type VARCHAR(100) NOT NULL, -- RDA, RDH, CPR, HIPAA, etc.
  license_number VARCHAR(100),
  issuing_authority VARCHAR(255),
  issue_date DATE,
  expiration_date DATE,
  status VARCHAR(50) DEFAULT 'current', -- current, expiring_soon, urgent, expired
  ce_hours_required INTEGER DEFAULT 0,
  ce_hours_completed INTEGER DEFAULT 0,
  verification_url TEXT,
  document_url TEXT,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PERFORMANCE REVIEWS (Tab 7)
-- =============================================
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_type VARCHAR(50), -- 30_day, 60_day, 90_day, quarterly, annual, pip
  period_start DATE,
  period_end DATE,
  scheduled_date DATE,
  actual_date DATE,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, pending_employee, pending_review, complete, overdue
  
  -- Scores (1-5 scale)
  overall_rating DECIMAL(3,2),
  job_knowledge_score DECIMAL(3,2),
  quality_score DECIMAL(3,2),
  productivity_score DECIMAL(3,2),
  communication_score DECIMAL(3,2),
  teamwork_score DECIMAL(3,2),
  attendance_score DECIMAL(3,2),
  initiative_score DECIMAL(3,2),
  
  -- Text Fields
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_set TEXT,
  employee_comments TEXT,
  reviewer_comments TEXT,
  
  -- Compensation
  raise_recommended BOOLEAN DEFAULT false,
  raise_percentage DECIMAL(5,2),
  raise_amount DECIMAL(10,2),
  raise_effective_date DATE,
  promotion_recommended BOOLEAN DEFAULT false,
  promotion_to_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  
  -- Signatures
  document_url TEXT,
  employee_signed BOOLEAN DEFAULT false,
  employee_signed_date TIMESTAMP WITH TIME ZONE,
  reviewer_signed BOOLEAN DEFAULT false,
  reviewer_signed_date TIMESTAMP WITH TIME ZONE,
  
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PERFORMANCE METRICS / KPIs (Tab 8)
-- =============================================
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  metric_period VARCHAR(50), -- daily, weekly, monthly, quarterly
  period_start DATE,
  period_end DATE,
  
  -- Flexible metric storage
  metrics JSONB NOT NULL DEFAULT '{}', -- {"case_acceptance_rate": {"target": 65, "actual": 72, "status": "above"}}
  
  overall_rating VARCHAR(50), -- exceeds, meets, below
  manager_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DISCIPLINE TRACKER (Tab 9)
-- =============================================
CREATE TABLE discipline_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  incident_id VARCHAR(50), -- INC-2024-001 format
  incident_date DATE NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Incident Details
  category VARCHAR(100), -- attendance, conduct, performance, policy_violation, gossip
  incident_type VARCHAR(100), -- tardiness, no_call_no_show, dress_code, etc.
  description TEXT NOT NULL,
  policy_violated TEXT,
  
  -- Discipline
  discipline_level VARCHAR(50), -- coaching, verbal, written, final, termination
  prior_incidents_count INTEGER DEFAULT 0,
  action_taken TEXT,
  improvement_required TEXT,
  timeline VARCHAR(100),
  follow_up_date DATE,
  follow_up_complete BOOLEAN DEFAULT false,
  outcome VARCHAR(50), -- improved, no_change, escalated, resolved
  
  -- Points (for attendance-related incidents)
  points_assessed DECIMAL(4,1) DEFAULT 0,
  
  -- Documentation
  witness_id UUID REFERENCES users(id) ON DELETE SET NULL,
  witness_name VARCHAR(255),
  employee_acknowledged BOOLEAN DEFAULT false,
  acknowledge_date TIMESTAMP WITH TIME ZONE,
  employee_refused_to_sign BOOLEAN DEFAULT false,
  document_url TEXT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ATTENDANCE LOG (Tab 10)
-- =============================================
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Schedule
  scheduled_start TIME,
  scheduled_end TIME,
  actual_start TIME,
  actual_end TIME,
  scheduled_hours DECIMAL(4,2),
  actual_hours DECIMAL(4,2),
  
  -- Status
  status VARCHAR(50) NOT NULL, -- present, absent, tardy, left_early, partial
  absence_type VARCHAR(50), -- sick, pto, no_call, excused, unexcused, bereavement, jury_duty, fmla
  
  -- Call-out Info
  call_out_time TIME,
  call_out_method VARCHAR(50), -- phone, text, app, in_person
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Documentation
  documentation_required BOOLEAN DEFAULT false,
  documentation_received BOOLEAN DEFAULT false,
  coverage_found BOOLEAN,
  coverage_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- Points
  points_assessed DECIMAL(4,1) DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(employee_id, date)
);

-- =============================================
-- PTO REQUESTS (Tab 11)
-- =============================================
CREATE TABLE pto_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  request_id VARCHAR(50), -- PTO-2024-001 format
  request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Request Details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_hours DECIMAL(5,2),
  total_days DECIMAL(4,2),
  pto_type VARCHAR(50), -- vacation, sick, personal, bereavement, unpaid, other
  reason TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, denied, cancelled, withdrawn
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_date TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,
  
  -- Coverage
  coverage_arranged BOOLEAN DEFAULT false,
  coverage_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  coverage_notes TEXT,
  
  -- Balance
  balance_before DECIMAL(5,2),
  balance_after DECIMAL(5,2),
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TRAINING & DEVELOPMENT (Tab 12)
-- =============================================
CREATE TABLE training_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- compliance, skills, leadership, onboarding, clinical, safety
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  required_for_positions UUID[], -- array of position IDs
  frequency VARCHAR(50), -- one_time, annual, quarterly, as_needed
  duration_hours DECIMAL(4,2),
  ce_credits DECIMAL(4,2) DEFAULT 0,
  provider VARCHAR(255),
  cost DECIMAL(10,2) DEFAULT 0,
  content_url TEXT,
  passing_score DECIMAL(5,2), -- minimum score to pass if there's an assessment
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE employee_training (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  course_id UUID REFERENCES training_courses(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE,
  start_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'assigned', -- assigned, in_progress, complete, overdue, waived
  score DECIMAL(5,2),
  passed BOOLEAN,
  attempts INTEGER DEFAULT 0,
  certificate_url TEXT,
  expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- OFFBOARDING (Tab 13)
-- =============================================
CREATE TABLE offboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  separation_type VARCHAR(50), -- resignation, termination, layoff, retirement, job_abandonment
  termination_reason TEXT,
  is_voluntary BOOLEAN,
  notice_date DATE,
  last_work_date DATE,
  notice_period_days INTEGER,
  notice_period_met BOOLEAN,
  eligible_for_rehire VARCHAR(50), -- yes, no, with_conditions
  rehire_conditions TEXT,
  
  -- Exit Interview
  exit_interview_scheduled DATE,
  exit_interview_completed BOOLEAN DEFAULT false,
  exit_interview_date TIMESTAMP WITH TIME ZONE,
  exit_interview_conducted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  exit_interview_notes TEXT,
  departure_reason VARCHAR(100), -- better_opportunity, compensation, relocation, personal, management, culture, other
  would_recommend BOOLEAN,
  feedback TEXT,
  
  -- Final Pay
  final_paycheck_date DATE,
  pto_payout_hours DECIMAL(5,2),
  pto_payout_amount DECIMAL(10,2),
  other_payments DECIMAL(10,2),
  deductions TEXT,
  
  -- Property Return
  keys_returned BOOLEAN DEFAULT false,
  keys_returned_date DATE,
  badge_returned BOOLEAN DEFAULT false,
  badge_returned_date DATE,
  uniforms_returned BOOLEAN DEFAULT false,
  uniforms_returned_date DATE,
  equipment_returned BOOLEAN DEFAULT false,
  equipment_returned_date DATE,
  equipment_list TEXT,
  equipment_notes TEXT,
  
  -- Access
  system_access_revoked BOOLEAN DEFAULT false,
  system_access_revoked_date TIMESTAMP WITH TIME ZONE,
  system_access_revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  email_forwarded_to VARCHAR(255),
  
  -- Completion
  offboarding_complete BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completion_date TIMESTAMP WITH TIME ZONE,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PTO ACCRUAL SETTINGS
-- =============================================
CREATE TABLE pto_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  accrual_start_months INTEGER DEFAULT 6, -- months after hire to start accruing
  annual_pto_hours DECIMAL(5,2) DEFAULT 40, -- 5 days = 40 hours
  max_carryover_hours DECIMAL(5,2) DEFAULT 0, -- 0 = no rollover
  accrual_method VARCHAR(50) DEFAULT 'annual', -- annual, per_pay_period, monthly
  pto_year_start_month INTEGER DEFAULT 1, -- 1 = January
  blackout_dates JSONB DEFAULT '[]', -- array of date ranges
  require_advance_notice_days INTEGER DEFAULT 14,
  max_consecutive_days INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ATTENDANCE POINT SETTINGS
-- =============================================
CREATE TABLE attendance_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  tardiness_points DECIMAL(4,1) DEFAULT 1.0,
  left_early_points DECIMAL(4,1) DEFAULT 1.0,
  no_coverage_points DECIMAL(4,1) DEFAULT 1.0,
  unexcused_absence_points DECIMAL(4,1) DEFAULT 3.0,
  no_call_no_show_points DECIMAL(4,1) DEFAULT 10.0,
  rolling_period_days INTEGER DEFAULT 90, -- points reset after X clean days
  verbal_warning_threshold DECIMAL(4,1) DEFAULT 2.0,
  written_warning_threshold DECIMAL(4,1) DEFAULT 5.0,
  final_warning_threshold DECIMAL(4,1) DEFAULT 7.0,
  termination_threshold DECIMAL(4,1) DEFAULT 10.0,
  grace_period_minutes INTEGER DEFAULT 10, -- minutes late before tardy
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AUDIT LOG (Track all changes)
-- =============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- create, update, delete, view, sign, approve, login, logout
  entity_type VARCHAR(100) NOT NULL, -- employee, document, review, etc.
  entity_id UUID,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100), -- license_expiring, review_due, document_pending, pto_request, etc.
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  title VARCHAR(255),
  message TEXT,
  link TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SCHEDULED TASKS (for recurring actions)
-- =============================================
CREATE TABLE scheduled_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  review_type VARCHAR(50) NOT NULL,
  scheduled_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, created, skipped
  created_review_id UUID REFERENCES performance_reviews(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Organization indexes
CREATE INDEX idx_organizations_subscription ON organizations(subscription_status, subscription_tier);

-- User indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_auth ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(organization_id, role);

-- Employee indexes
CREATE INDEX idx_employees_organization ON employees(organization_id);
CREATE INDEX idx_employees_status ON employees(organization_id, status);
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_employees_department ON employees(organization_id, department);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
CREATE INDEX idx_employees_reports_to ON employees(reports_to);

-- Position indexes
CREATE INDEX idx_positions_organization ON positions(organization_id);
CREATE INDEX idx_positions_department ON positions(organization_id, department);

-- Onboarding indexes
CREATE INDEX idx_onboarding_templates_org ON onboarding_templates(organization_id);
CREATE INDEX idx_employee_onboarding_status ON employee_onboarding(status);
CREATE INDEX idx_employee_onboarding_employee ON employee_onboarding(employee_id);

-- Document indexes
CREATE INDEX idx_document_templates_org ON document_templates(organization_id);
CREATE INDEX idx_document_templates_type ON document_templates(organization_id, type);
CREATE INDEX idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX idx_employee_documents_status ON employee_documents(status);

-- License indexes
CREATE INDEX idx_licenses_employee ON licenses(employee_id);
CREATE INDEX idx_licenses_expiration ON licenses(expiration_date);
CREATE INDEX idx_licenses_status ON licenses(status);

-- Performance review indexes
CREATE INDEX idx_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX idx_reviews_status ON performance_reviews(status);
CREATE INDEX idx_reviews_scheduled ON performance_reviews(scheduled_date);
CREATE INDEX idx_reviews_type ON performance_reviews(review_type);

-- Performance metrics indexes
CREATE INDEX idx_metrics_employee ON performance_metrics(employee_id);
CREATE INDEX idx_metrics_period ON performance_metrics(period_start, period_end);

-- Discipline indexes
CREATE INDEX idx_discipline_employee ON discipline_incidents(employee_id);
CREATE INDEX idx_discipline_date ON discipline_incidents(incident_date);
CREATE INDEX idx_discipline_category ON discipline_incidents(category);
CREATE INDEX idx_discipline_level ON discipline_incidents(discipline_level);

-- Attendance indexes
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- PTO indexes
CREATE INDEX idx_pto_employee ON pto_requests(employee_id);
CREATE INDEX idx_pto_status ON pto_requests(status);
CREATE INDEX idx_pto_dates ON pto_requests(start_date, end_date);

-- Training indexes
CREATE INDEX idx_training_courses_org ON training_courses(organization_id);
CREATE INDEX idx_training_courses_category ON training_courses(organization_id, category);
CREATE INDEX idx_employee_training_employee ON employee_training(employee_id);
CREATE INDEX idx_employee_training_status ON employee_training(status);
CREATE INDEX idx_employee_training_due ON employee_training(due_date);

-- Offboarding indexes
CREATE INDEX idx_offboarding_employee ON offboarding(employee_id);
CREATE INDEX idx_offboarding_dates ON offboarding(last_work_date);

-- Audit log indexes
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_org ON audit_log(organization_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

-- Scheduled reviews indexes
CREATE INDEX idx_scheduled_reviews_org ON scheduled_reviews(organization_id);
CREATE INDEX idx_scheduled_reviews_date ON scheduled_reviews(scheduled_date);
CREATE INDEX idx_scheduled_reviews_status ON scheduled_reviews(status);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_templates_updated_at BEFORE UPDATE ON onboarding_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_template_tasks_updated_at BEFORE UPDATE ON onboarding_template_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_onboarding_updated_at BEFORE UPDATE ON employee_onboarding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_onboarding_tasks_updated_at BEFORE UPDATE ON employee_onboarding_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON employee_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discipline_incidents_updated_at BEFORE UPDATE ON discipline_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pto_requests_updated_at BEFORE UPDATE ON pto_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_courses_updated_at BEFORE UPDATE ON training_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_training_updated_at BEFORE UPDATE ON employee_training FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offboarding_updated_at BEFORE UPDATE ON offboarding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pto_settings_updated_at BEFORE UPDATE ON pto_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_settings_updated_at BEFORE UPDATE ON attendance_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_reviews_updated_at BEFORE UPDATE ON scheduled_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pto_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE pto_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reviews ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM users WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if user is admin or owner
CREATE OR REPLACE FUNCTION auth.is_admin_or_owner()
RETURNS BOOLEAN AS $$
  SELECT role IN ('owner', 'admin') FROM users WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Organization policies
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (id = auth.user_organization_id());

CREATE POLICY "Owners can update their organization" ON organizations
  FOR UPDATE USING (id = auth.user_organization_id() AND auth.user_role() = 'owner');

-- Users policies
CREATE POLICY "Users can view users in their organization" ON users
  FOR SELECT USING (organization_id = auth.user_organization_id());

CREATE POLICY "Admins can manage users in their organization" ON users
  FOR ALL USING (organization_id = auth.user_organization_id() AND auth.is_admin_or_owner());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Employees policies
CREATE POLICY "Users can view employees in their organization" ON employees
  FOR SELECT USING (organization_id = auth.user_organization_id());

CREATE POLICY "Admins can manage employees" ON employees
  FOR ALL USING (organization_id = auth.user_organization_id() AND auth.is_admin_or_owner());

-- Positions policies
CREATE POLICY "Users can view positions in their organization" ON positions
  FOR SELECT USING (organization_id = auth.user_organization_id());

CREATE POLICY "Admins can manage positions" ON positions
  FOR ALL USING (organization_id = auth.user_organization_id() AND auth.is_admin_or_owner());

-- Document templates policies
CREATE POLICY "Users can view document templates" ON document_templates
  FOR SELECT USING (organization_id = auth.user_organization_id());

CREATE POLICY "Admins can manage document templates" ON document_templates
  FOR ALL USING (organization_id = auth.user_organization_id() AND auth.is_admin_or_owner());

-- Employee documents policies - employees can view their own
CREATE POLICY "Users can view employee documents in their org" ON employee_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = employee_documents.employee_id 
      AND e.organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Admins can manage employee documents" ON employee_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = employee_documents.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

-- Licenses policies
CREATE POLICY "Users can view licenses in their org" ON licenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = licenses.employee_id 
      AND e.organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Admins can manage licenses" ON licenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = licenses.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

-- Performance reviews policies
CREATE POLICY "Users can view reviews in their org" ON performance_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = performance_reviews.employee_id 
      AND e.organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Admins can manage reviews" ON performance_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = performance_reviews.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

-- Discipline incidents policies (restricted to managers and above)
CREATE POLICY "Managers can view discipline incidents" ON discipline_incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = discipline_incidents.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.user_role() IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Admins can manage discipline incidents" ON discipline_incidents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = discipline_incidents.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

-- Attendance records policies
CREATE POLICY "Users can view attendance in their org" ON attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = attendance_records.employee_id 
      AND e.organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Admins and managers can manage attendance" ON attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = attendance_records.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.user_role() IN ('owner', 'admin', 'manager')
  );

-- PTO requests policies
CREATE POLICY "Users can view PTO requests in their org" ON pto_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = pto_requests.employee_id 
      AND e.organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Employees can create their own PTO requests" ON pto_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e 
      JOIN users u ON e.user_id = u.id
      WHERE e.id = pto_requests.employee_id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can manage PTO requests" ON pto_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = pto_requests.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.user_role() IN ('owner', 'admin', 'manager')
  );

-- Training courses policies
CREATE POLICY "Users can view training courses" ON training_courses
  FOR SELECT USING (organization_id = auth.user_organization_id());

CREATE POLICY "Admins can manage training courses" ON training_courses
  FOR ALL USING (organization_id = auth.user_organization_id() AND auth.is_admin_or_owner());

-- Employee training policies
CREATE POLICY "Users can view training assignments" ON employee_training
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = employee_training.employee_id 
      AND e.organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Admins can manage training assignments" ON employee_training
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = employee_training.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

-- Onboarding templates policies
CREATE POLICY "Users can view onboarding templates" ON onboarding_templates
  FOR SELECT USING (organization_id = auth.user_organization_id());

CREATE POLICY "Admins can manage onboarding templates" ON onboarding_templates
  FOR ALL USING (organization_id = auth.user_organization_id() AND auth.is_admin_or_owner());

-- Onboarding template tasks policies
CREATE POLICY "Users can view template tasks" ON onboarding_template_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM onboarding_templates ot 
      WHERE ot.id = onboarding_template_tasks.template_id 
      AND ot.organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Admins can manage template tasks" ON onboarding_template_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM onboarding_templates ot 
      WHERE ot.id = onboarding_template_tasks.template_id 
      AND ot.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

-- Employee onboarding policies
CREATE POLICY "Users can view employee onboarding" ON employee_onboarding
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = employee_onboarding.employee_id 
      AND e.organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Admins can manage employee onboarding" ON employee_onboarding
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = employee_onboarding.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

-- Employee onboarding tasks policies
CREATE POLICY "Users can view onboarding tasks" ON employee_onboarding_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employee_onboarding eo 
      JOIN employees e ON e.id = eo.employee_id
      WHERE eo.id = employee_onboarding_tasks.employee_onboarding_id 
      AND e.organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Admins can manage onboarding tasks" ON employee_onboarding_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employee_onboarding eo 
      JOIN employees e ON e.id = eo.employee_id
      WHERE eo.id = employee_onboarding_tasks.employee_onboarding_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

-- Performance metrics policies
CREATE POLICY "Users can view performance metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = performance_metrics.employee_id 
      AND e.organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Admins can manage performance metrics" ON performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = performance_metrics.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

-- Offboarding policies
CREATE POLICY "Admins can view offboarding" ON offboarding
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = offboarding.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

CREATE POLICY "Admins can manage offboarding" ON offboarding
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = offboarding.employee_id 
      AND e.organization_id = auth.user_organization_id()
    ) AND auth.is_admin_or_owner()
  );

-- Settings policies
CREATE POLICY "Users can view PTO settings" ON pto_settings
  FOR SELECT USING (organization_id = auth.user_organization_id());

CREATE POLICY "Owners can manage PTO settings" ON pto_settings
  FOR ALL USING (organization_id = auth.user_organization_id() AND auth.user_role() = 'owner');

CREATE POLICY "Users can view attendance settings" ON attendance_settings
  FOR SELECT USING (organization_id = auth.user_organization_id());

CREATE POLICY "Owners can manage attendance settings" ON attendance_settings
  FOR ALL USING (organization_id = auth.user_organization_id() AND auth.user_role() = 'owner');

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Audit log policies (read-only for admins)
CREATE POLICY "Admins can view audit log" ON audit_log
  FOR SELECT USING (organization_id = auth.user_organization_id() AND auth.is_admin_or_owner());

-- Service role can insert audit logs
CREATE POLICY "Service can insert audit logs" ON audit_log
  FOR INSERT WITH CHECK (true);

-- Scheduled reviews policies
CREATE POLICY "Admins can view scheduled reviews" ON scheduled_reviews
  FOR SELECT USING (organization_id = auth.user_organization_id() AND auth.is_admin_or_owner());

CREATE POLICY "Admins can manage scheduled reviews" ON scheduled_reviews
  FOR ALL USING (organization_id = auth.user_organization_id() AND auth.is_admin_or_owner());
