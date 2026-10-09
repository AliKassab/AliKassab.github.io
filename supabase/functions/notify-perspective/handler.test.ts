import { createHandler } from './handler.ts';
const event = {
    type: 'INSERT', table: 'perspectives', schema: 'public',
    record: { id: '11111111-1111-4111-8111-111111111111', category: 'Narrative',
        question: 'What tells a story?', response: '<script>A visitor idea</script>', created_at: '2026-10-09T12:00:00Z' },
};
const secrets: Record<string, string> = {
    PERSPECTIVES_WEBHOOK_SECRET: 'test-webhook-secret', RESEND_API_KEY: 'test-api-key',
    PERSPECTIVES_NOTIFICATION_TO: 'owner@example.com', PERSPECTIVES_NOTIFICATION_FROM: 'Portfolio <mail@example.com>',
};
function request(body = event, secret = secrets.PERSPECTIVES_WEBHOOK_SECRET) {
    return new Request('https://example.com', { method: 'POST', headers: { 'x-webhook-secret': secret }, body: JSON.stringify(body) });
}
function equal(actual: unknown, expected: unknown) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
Deno.test('unauthorized or non-insert calls never send mail', async () => {
    let calls = 0;
    const handler = createHandler({ getSecret: n => secrets[n], send: () => { calls++; return Promise.resolve(new Response()); } });
    equal((await handler(request(event, 'wrong'))).status, 401);
    equal((await handler(request({ ...event, type: 'UPDATE' }))).status, 400);
    equal(calls, 0);
});
Deno.test('email includes fields as plain text and an idempotency key', async () => {
    const handler = createHandler({ getSecret: n => secrets[n], send: async (_, init) => {
        const headers = new Headers(init?.headers);
        equal(headers.get('Idempotency-Key'), `perspective-${event.record.id}`);
        const email = JSON.parse(String(init?.body));
        equal(email.subject, 'New perspective: Narrative');
        equal(email.to, ['owner@example.com']);
        equal(email.html, undefined);
        for (const value of [event.record.question, event.record.response, event.record.created_at]) {
            if (!email.text.includes(value)) throw new Error('Email field missing');
        }
        return new Response('{}', { status: 200 });
    } });
    equal((await handler(request())).status, 200);
});
Deno.test('Resend failure returns an error without any database operations', async () => {
    const handler = createHandler({ getSecret: n => secrets[n], send: async url => {
        equal(url, 'https://api.resend.com/emails');
        return new Response('{}', { status: 500 });
    } });
    equal((await handler(request())).status, 502);
});
Deno.test('network errors and missing server secrets are handled', async () => {
    equal((await createHandler({ getSecret: n => secrets[n], send: () => Promise.reject(new Error('Offline')) })(request())).status, 502);
    equal((await createHandler({ getSecret: n => n === 'PERSPECTIVES_WEBHOOK_SECRET' ? secrets[n] : undefined, send: fetch })(request())).status, 503);
});
