type Dependencies = {
    getSecret: (name: string) => string | undefined;
    send: typeof fetch;
};

export function createHandler({ getSecret, send }: Dependencies) {
    return async (request: Request): Promise<Response> => {
        if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
        const secret = getSecret('PERSPECTIVES_WEBHOOK_SECRET');
        if (!secret || request.headers.get('x-webhook-secret') !== secret) {
            return new Response('Unauthorized', { status: 401 });
        }
        const apiKey = getSecret('RESEND_API_KEY');
        const recipient = getSecret('PERSPECTIVES_NOTIFICATION_TO');
        const sender = getSecret('PERSPECTIVES_NOTIFICATION_FROM');
        if (!apiKey || !recipient || !sender) return new Response('Notification configuration missing', { status: 503 });
        if (Number(request.headers.get('content-length')) > 65536) return new Response('Payload too large', { status: 413 });
        let event;
        try {
            const body = await request.text();
            if (body.length > 65536) return new Response('Payload too large', { status: 413 });
            event = JSON.parse(body);
        } catch { return new Response('Invalid JSON', { status: 400 }); }
        const record = event?.record;
        if (event?.type !== 'INSERT' || event?.schema !== 'public' || event?.table !== 'perspectives' ||
            !record || typeof record.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(record.id) ||
            typeof record.category !== 'string' || record.category.length > 100 || /[\r\n]/.test(record.category) ||
            typeof record.question !== 'string' || record.question.length > 500 ||
            typeof record.response !== 'string' || !record.response.trim() || [...record.response].length > 5000 ||
            typeof record.created_at !== 'string' || !Number.isFinite(Date.parse(record.created_at))) {
            return new Response('Invalid perspective event', { status: 400 });
        }
        try {
            const result = await send('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Idempotency-Key': `perspective-${record.id}`,
                },
                body: JSON.stringify({
                    from: sender, to: [recipient],
                    subject: `New perspective: ${record.category}`,
                    // Plain text prevents visitor input being interpreted as HTML.
                    text: `Category: ${record.category}\n\nQuestion: ${record.question}\n\nSubmitted response:\n${record.response}\n\nSubmission timestamp: ${record.created_at}`,
                }),
                signal: AbortSignal.timeout(10000),
            });
            if (!result.ok) {
                console.error('Perspective notification failed', { id: record.id, status: result.status });
                return new Response('Notification failed; perspective remains stored', { status: 502 });
            }
            return new Response('Notification sent', { status: 200 });
        } catch {
            console.error('Perspective notification request failed', { id: record.id });
            return new Response('Notification failed; perspective remains stored', { status: 502 });
        }
    };
}
