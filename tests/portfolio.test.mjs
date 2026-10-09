import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

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

test('each project card links to its own complete detail page', async () => {
    const work = await readFile('work.html', 'utf8');
    const cards = [...work.matchAll(/<article data-project-category="[^"]+"[\s\S]*?<\/article>/g)].map(match => match[0]);
    assert.equal(cards.length, 14);
    const destinations = new Set();
    for (const card of cards) {
        const title = card.match(/<h2[^>]*>(.*?)<\/h2>/)[1];
        const destination = card.match(/href="(projects\/[^"]+\.html)"/)[1];
        assert.ok(!destinations.has(destination));
        destinations.add(destination);
        const detail = await readFile(destination, 'utf8');
        assert.ok(detail.includes(title));
        assert.equal([...detail.matchAll(/<h1\b/g)].length, 1);
        assert.ok(detail.includes('href="../work.html"'));
        assert.ok(detail.includes('data-nav-page="work.html"'));
        assert.ok(detail.indexOf('../scripts/public-config.js') < detail.indexOf('../scripts/config.js'));
        const ids = [...detail.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
        assert.equal(ids.length, new Set(ids).size);
        for (const [, ref] of detail.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
            if (!ref || /^(https?:|data:|mailto:)/.test(ref)) continue;
            if (ref.startsWith('#')) assert.ok(ids.includes(ref.slice(1)), `${destination}: ${ref}`);
            else await access(resolve(dirname(destination), ref));
        }
        assert.ok(/href="https?:/.test(detail), `${destination}: project links preserved`);
    }
});
