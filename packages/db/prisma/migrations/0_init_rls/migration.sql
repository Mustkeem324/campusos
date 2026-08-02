-- Up Migration: Row Level Security Setup for CampusOS

-- Function to read session tenant variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS helper setup
ALTER TABLE "institutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campuses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_offerings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- Create Tenant Isolation Policies
CREATE POLICY inst_rls ON "institutions" USING (id = current_tenant_id());
CREATE POLICY dept_rls ON "departments" USING (tenant_id = current_tenant_id());
CREATE POLICY user_rls ON "users" USING (tenant_id = current_tenant_id());
CREATE POLICY student_rls ON "students" USING (tenant_id = current_tenant_id());
CREATE POLICY course_rls ON "courses" USING (tenant_id = current_tenant_id());
CREATE POLICY invoice_rls ON "invoices" USING (tenant_id = current_tenant_id());
CREATE POLICY notice_rls ON "notices" USING (tenant_id = current_tenant_id());
CREATE POLICY audit_rls ON "audit_logs" USING (tenant_id = current_tenant_id());

-- Down Migration (Rollback Script)
/*
DROP POLICY IF EXISTS inst_rls ON "institutions";
DROP POLICY IF EXISTS dept_rls ON "departments";
DROP POLICY IF EXISTS user_rls ON "users";
DROP POLICY IF EXISTS student_rls ON "students";
DROP POLICY IF EXISTS course_rls ON "courses";
DROP POLICY IF EXISTS invoice_rls ON "invoices";
DROP POLICY IF EXISTS notice_rls ON "notices";
DROP POLICY IF EXISTS audit_rls ON "audit_logs";

DROP FUNCTION IF EXISTS current_tenant_id();
*/
