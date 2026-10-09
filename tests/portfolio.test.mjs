import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

test('existing pages retain valid local links, unique IDs, and shared config', async () => {
    for (const file of ['index.html', 'work.html', 'projects.html', 'explore.html']) {
        const html = await readFile(file, 'utf8');
        assert.ok(html.indexOf('scripts/public-config.js') < html.indexOf('scripts/config.js'));
        const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
        assert.equal(new Set(ids).size, ids.length);
        for (const [, ref] of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
            if (!ref || /^(https?:|data:|mailto:)/.test(ref)) continue;
            if (ref.startsWith('#')) assert.ok(ids.includes(ref.slice(1)), `${file}: ${ref}`);
            else await access(ref);
        }
    }
    const explore = await readFile('explore.html', 'utf8');
    assert.equal([...explore.matchAll(/class="explore-answer /g)].length, 4);
    assert.equal([...explore.matchAll(/maxlength="5000"/g)].length, 4);
    assert.ok(explore.indexOf('scripts/perspectives.js') < explore.indexOf('scripts/site.js'));
});
