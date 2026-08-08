-- Hot-path indexes for cursor/listing and tenant-scoped operational queries.
-- For a large production database, apply equivalent CREATE INDEX CONCURRENTLY
-- statements through the deployment runbook before recording this migration.

CREATE UNIQUE INDEX "students_tenant_id_roll_number_key" ON "students"("tenant_id", "rollNumber");
CREATE INDEX "students_tenant_id_section_id_idx" ON "students"("tenant_id", "section_id");
CREATE UNIQUE INDEX "staff_tenant_id_employee_id_key" ON "staff"("tenant_id", "employeeId");
CREATE INDEX "staff_tenant_id_department_id_idx" ON "staff"("tenant_id", "department_id");
CREATE INDEX "timetable_slots_tenant_id_course_offering_id_day_of_week_idx" ON "timetable_slots"("tenant_id", "course_offering_id", "dayOfWeek");
CREATE INDEX "attendance_sessions_tenant_id_course_offering_id_session_date_idx" ON "attendance_sessions"("tenant_id", "course_offering_id", "sessionDate");
CREATE UNIQUE INDEX "attendance_records_attendance_session_id_student_id_key" ON "attendance_records"("attendance_session_id", "student_id");
CREATE INDEX "attendance_records_tenant_id_student_id_attendance_session_id_idx" ON "attendance_records"("tenant_id", "student_id", "attendance_session_id");
CREATE INDEX "invoices_tenant_id_status_due_date_idx" ON "invoices"("tenant_id", "status", "dueDate");
CREATE INDEX "payments_tenant_id_paid_at_idx" ON "payments"("tenant_id", "paidAt");
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "createdAt" DESC);
CREATE INDEX "notifications_tenant_id_user_id_is_archived_created_at_idx" ON "notifications"("tenant_id", "user_id", "is_archived", "createdAt" DESC);
