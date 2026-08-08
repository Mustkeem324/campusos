import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: { reads: { executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '30s', target: 20 }, { duration: '30s', target: 0 }] } },
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500'] },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const headers = __ENV.COOKIE ? { Cookie: __ENV.COOKIE } : {};

export default function apiSmokeScenario() {
  const response = http.get(`${baseUrl}/api/notifications?limit=50`, { headers });
  check(response, { 'successful bounded inbox response': (r) => r.status === 200 && r.body.length < 1_000_000 });
  sleep(1);
}
