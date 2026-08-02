import { describe, it, expect } from 'vitest';
import { generatePrometheusMetrics } from '../lib/observability-service';

describe('Phase 19 Prometheus Metrics Endpoint Exporter Test Suite', () => {
  it('should generate valid Prometheus metric format containing http_requests_total and active_tenant_count', () => {
    const rawMetrics = generatePrometheusMetrics();

    expect(rawMetrics).toContain('# HELP http_requests_total');
    expect(rawMetrics).toContain('# TYPE http_requests_total counter');
    expect(rawMetrics).toContain('http_requests_total 489201');
    expect(rawMetrics).toContain('active_tenant_count 42');
  });
});
