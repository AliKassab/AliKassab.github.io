import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { publicConfig } from '../scripts/build.mjs';
const source = await readFile('scripts/perspectives.js', 'utf8');
function client(fetch) {
    const window = { SITE_CONFIG: { supabase: { url: 'https://example.supabase.co', key: 'sb_publishable_test' } } };
    vm.runInNewContext(source, { window, fetch, Error });
    return window.Perspectives;
}
test('validates whitespace and length before making requests', async () => {
    let calls = 0;
    const api = client(async () => { calls++; return { ok: true }; });
    await assert.rejects(api.submit('narrative', ' \t\n'), /Add your perspective/);
    await assert.rejects(api.submit('narrative', 'a'.repeat(5001)), /5,000/);
    await assert.rejects(api.submit('unknown', 'hi'), /unavailable/);
    assert.equal(calls, 0);
});
test('inserts anonymously with minimal return and no moderation fields', async () => {
    let request;
    const api = client(async (url, options) => { request = { url, ...options }; return { ok: true }; });
    await api.submit('narrative', '  My answer  ');
    assert.equal(request.url, 'https://example.supabase.co/rest/v1/perspectives');
    assert.equal(request.headers.Prefer, 'return=minimal');
    assert.equal(request.headers.Authorization, undefined);
    const payload = JSON.parse(request.body);
    assert.deepEqual(Object.keys(payload).sort(), ['category', 'question', 'response']);
    assert.equal(payload.category, 'Narrative');
    assert.equal(payload.response, 'My answer');
});
test('legacy anon JWT is passed as bearer', async () => {
    let headers;
    const api = client(async (_, options) => { headers = options.headers; return { ok: true }; });
    await api.submit('mechanics', 'Example', { url: 'https://example.supabase.co', key: 'legacy-jwt' });
    assert.equal(headers.Authorization, 'Bearer legacy-jwt');
});
test('duplicate clicks are blocked; success clears and failures preserve input', async () => {
    for (const ok of [true, false]) {
        let handler, resolve, calls = 0;
        const api = client(() => { calls++; return new Promise(r => { resolve = r; }); });
        const field = { value: 'My response', focus() {} }, status = {}, button = {}, attributes = {};
        const form = { elements: { answer: field }, dataset: { questionId: 'narrative' },
            querySelector: s => s.startsWith('button') ? button : status,
            setAttribute: (k, v) => { attributes[k] = v; }, addEventListener: (_, f) => { handler = f; } };
        api.bindForms({ querySelectorAll: () => [form] });
        const pending = handler({ preventDefault() {} });
        await handler({ preventDefault() {} });
        assert.equal(calls, 1); assert.equal(button.disabled, true); assert.equal(attributes['aria-busy'], 'true');
        resolve({ ok }); await pending;
        assert.equal(field.value, ok ? '' : 'My response');
        assert.equal(button.disabled, false); assert.equal(attributes['aria-busy'], 'false');
        assert.match(status.textContent, ok ? /Thanks/ : /Couldn’t/);
    }
});
test('build rejects privileged keys and missing launch configuration', () => {
    assert.throws(() => publicConfig({ EXPLORE_ENABLED: 'true' }), /requires/);
    assert.throws(() => publicConfig({ PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_bad' }), /publishable/);
    const jwt = 'a.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url') + '.b';
    assert.throws(() => publicConfig({ PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt }), /publishable/);
    const config = publicConfig({ PRIVATE_SECRET: 'excluded' });
    assert.equal(JSON.stringify(config).includes('excluded'), false);
});
