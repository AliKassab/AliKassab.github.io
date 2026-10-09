// Browser settings come from the generated public configuration.
window.SITE_CONFIG = Object.freeze({
    supabase: Object.freeze({
        url: window.PORTFOLIO_ENV?.supabaseUrl || '',
        key: window.PORTFOLIO_ENV?.supabaseKey || ''
    }),
    explore: Object.freeze({
        enabled: window.PORTFOLIO_ENV?.exploreEnabled === true
    })
});

(() => {
    const explore = window.SITE_CONFIG.explore;
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const preview = local && new URLSearchParams(location.search).get('preview') === 'explore';
    document.documentElement.dataset.exploreEnabled = String(explore.enabled);
    if (location.pathname.endsWith('/explore.html') && !explore.enabled && !preview) {
        location.replace('index.html');
    }
})();
