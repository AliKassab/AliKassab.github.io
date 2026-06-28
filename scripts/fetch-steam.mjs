// Fetches public Steam profile data and writes steam-data.json.
// Runs in CI (GitHub Action) with STEAM_API_KEY provided as a repo secret,
// so the key is never exposed to the browser and CORS is a non-issue.
import { writeFile } from 'node:fs/promises';

const KEY = process.env.STEAM_API_KEY;
const STEAMID = process.env.STEAM_ID || '76561198980920161';

if (!KEY) {
    console.error('Missing STEAM_API_KEY environment variable.');
    process.exit(1);
}

const api = async (path) => {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(`https://api.steampowered.com/${path}${sep}key=${KEY}`);
    if (!res.ok) throw new Error(`${path} -> ${res.status} ${res.statusText}`);
    return res.json();
};

const main = async () => {
    const [sum, lvl, owned, recent] = await Promise.all([
        api(`ISteamUser/GetPlayerSummaries/v2/?steamids=${STEAMID}`),
        api(`IPlayerService/GetSteamLevel/v1/?steamid=${STEAMID}`),
        api(`IPlayerService/GetOwnedGames/v1/?steamid=${STEAMID}&include_appinfo=true&include_played_free_games=true`),
        api(`IPlayerService/GetRecentlyPlayedGames/v1/?steamid=${STEAMID}`),
    ]);

    const player = sum.response?.players?.[0] || {};
    const games = owned.response?.games || [];
    const totalMinutes = games.reduce((acc, g) => acc + (g.playtime_forever || 0), 0);

    const data = {
        updated: new Date().toISOString(),
        profile: {
            name: player.personaname || null,
            avatar: player.avatarfull || null,
            url: player.profileurl || `https://steamcommunity.com/profiles/${STEAMID}/`,
            memberSince: player.timecreated ? new Date(player.timecreated * 1000).getFullYear() : null,
            level: lvl.response?.player_level ?? null,
            gameCount: owned.response?.game_count ?? (games.length || null),
            totalHours: totalMinutes ? Math.round(totalMinutes / 60) : null,
        },
        recent: (recent.response?.games || []).slice(0, 6).map((g) => ({
            appid: g.appid,
            name: g.name,
            hours2w: Math.round(((g.playtime_2weeks || 0) / 60) * 10) / 10,
            hoursTotal: Math.round((g.playtime_forever || 0) / 60),
            img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/capsule_231x87.jpg`,
        })),
    };

    await writeFile('steam-data.json', JSON.stringify(data, null, 2) + '\n');
    console.log('Wrote steam-data.json:', JSON.stringify(data.profile));
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
