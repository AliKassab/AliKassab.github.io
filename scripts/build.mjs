import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

export function publicConfig(env) {
    const url = env.PUBLIC_SUPABASE_URL || '';
    const key = env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    const enabled = env.EXPLORE_ENABLED === 'true';
    if (enabled && (!url || !key)) throw new Error('Explore requires PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    if (url && new URL(url).protocol !== 'https:') throw new Error('PUBLIC_SUPABASE_URL must use HTTPS');
    if (key && !key.startsWith('sb_publishable_')) {
        let payload;
        try { payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()); } catch { /* rejected below */ }
        if (payload?.role !== 'anon') throw new Error('Use a publishable or legacy anon key only');
    }
    return { supabaseUrl: url.replace(/\/$/, ''), supabaseKey: key, exploreEnabled: enabled };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    const config = publicConfig(process.env);
    await rm('dist', { recursive: true, force: true });
    await mkdir('dist/scripts', { recursive: true });
    // Explicit public asset allowlist: server code, secrets, and tests never ship.
    for (const file of ['index.html', 'work.html', 'projects.html', 'explore.html', 'styles.css', 'steam-data.json', 'AliKassabCV.pdf', 'CNAME', 'Images']) {
        await cp(file, `dist/${file}`, { recursive: true });
    }
    for (const file of ['config.js', 'site.js', 'perspectives.js']) await cp(`scripts/${file}`, `dist/scripts/${file}`);
    await writeFile('dist/scripts/public-config.js', `window.PORTFOLIO_ENV = Object.freeze(${JSON.stringify(config)});\n`);
    console.log('Built portfolio in dist/ (public configuration only).');
}
