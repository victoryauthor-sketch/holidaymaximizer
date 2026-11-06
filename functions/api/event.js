const ALLOWED_EVENTS = new Set([
  'planner_complete',
  'return_visit',
  'ics_export_single',
  'ics_export_plan',
  'hr_summary_copy',
  'plan_summary_copy',
  'share_url_copy',
  'referral_click',
  'ad_slot_rendered',
  'ad_slot_blocked',
  'consent_granted',
  'consent_declined'
]);

const sanitizeCode = (val, maxLen = 24) =>
  typeof val === 'string' ? val.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, maxLen) : '';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const event = sanitizeCode(body?.event, 32);
    if (!ALLOWED_EVENTS.has(event)) {
      return new Response(JSON.stringify({ ok: false, error: 'unsupported_event' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }
    const cfCountry = sanitizeCode(context.request.cf?.country || '', 4);
    const payload = {
      ts: new Date().toISOString(),
      type: 'hm_aggregate_metric',
      event,
      device: body?.device === 'mobile' ? 'mobile' : 'desktop',
      lang: body?.lang === 'fr' ? 'fr' : 'en',
      countryPage: sanitizeCode(body?.countryPage, 12),
      visitorCountry: cfCountry,
      slot: sanitizeCode(body?.slot, 8),
      unit: sanitizeCode(body?.unit, 16)
    };
    console.log(JSON.stringify(payload));
    return new Response(JSON.stringify({ ok: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: 'HolidayMaximizer Aggregate Telemetry',
      privacy: 'aggregate-only-no-personal-calculator-inputs'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    }
  );
}
