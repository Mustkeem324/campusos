DO $$
BEGIN
  ALTER TABLE campusos_exam_proctoring.vision_findings
    ADD CONSTRAINT vision_findings_observable_event_type_ck
    CHECK (event_type IN (
      'PERSON_NOT_VISIBLE',
      'MULTIPLE_PEOPLE_VISIBLE',
      'PROHIBITED_DEVICE_VISIBLE',
      'UNAUTHORIZED_MATERIAL_VISIBLE',
      'CAMERA_OBSTRUCTED',
      'CAMERA_POSITION_CHANGED',
      'WORKSPACE_LEFT',
      'WORKSPACE_VISIBILITY_REDUCED'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON CONSTRAINT vision_findings_observable_event_type_ck
  ON campusos_exam_proctoring.vision_findings
  IS 'AI vision findings are restricted to observable exam-workspace events. Sensitive-trait, identity, emotion, disability, demographic, intent, guilt, or academic-verdict labels are not valid finding types.';
