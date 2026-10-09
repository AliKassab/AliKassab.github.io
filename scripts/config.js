// Launch Explore by setting enabled to true and providing your answer endpoint.
// POST body: { questionId: string, answer: string }. Return 2xx after saving.
window.SITE_CONFIG = Object.freeze({
    explore: Object.freeze({
        enabled: true,
        endpoint: ''
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
