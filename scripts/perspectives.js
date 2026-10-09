(() => {
    const MAX_LENGTH = 5000;
    const questions = Object.freeze({
        narrative: ['Narrative', 'How can a world tell its story, and how can the story reshape the world?'],
        mechanics: ['Mechanics', 'How can gameplay mechanics grow out of a world and change as that world evolves?'],
        'world-building': ['World Building', 'When does a world’s history grow from lore into a series of chronicles?'],
        technology: ['Technology serving the design', 'How can technology break the barriers that limit creative expression?']
    });

    async function submit(questionId, input, config = window.SITE_CONFIG.supabase) {
        const response = input.trim();
        if (!response) throw new Error('Add your perspective before sharing.');
        if (response.length > MAX_LENGTH) throw new Error('Please keep your answer within 5,000 characters.');
        if (!questions[questionId]) throw new Error('This question is unavailable.');
        if (!config.url || !config.key) throw new Error('Answers aren’t open yet. Please check back soon.');
        const [category, question] = questions[questionId];
        const headers = { 'Content-Type': 'application/json', apikey: config.key, Prefer: 'return=minimal' };
        // Legacy anon keys are JWTs; modern publishable keys belong only in apikey.
        if (!config.key.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${config.key}`;
        const result = await fetch(`${config.url}/rest/v1/perspectives`, {
            method: 'POST', headers,
            body: JSON.stringify({ category, question, response })
        });
        if (!result.ok) throw new Error('Couldn’t send your answer. Please try again.');
    }

    function bindForms(root) {
        root.querySelectorAll('.explore-answer').forEach(form => {
            const field = form.elements.answer;
            const status = form.querySelector('.answer-status');
            const button = form.querySelector('button[type="submit"]');
            field.maxLength = MAX_LENGTH;
            let sending = false;
            form.addEventListener('submit', async event => {
                event.preventDefault();
                if (sending) return;
                if (!field.value.trim() || field.value.trim().length > MAX_LENGTH) {
                    status.textContent = !field.value.trim() ? 'Add your perspective before sharing.' : 'Please keep your answer within 5,000 characters.';
                    field.focus(); return;
                }
                sending = true;
                button.disabled = true;
                field.readOnly = true;
                form.setAttribute('aria-busy', 'true');
                button.textContent = 'Sharing…';
                status.textContent = '';
                try {
                    await submit(form.dataset.questionId, field.value);
                    field.value = '';
                    status.textContent = 'Thanks for sharing your perspective.';
                } catch (error) {
                    status.textContent = error instanceof Error ? error.message : 'Couldn’t send your answer. Please try again.';
                } finally {
                    sending = false;
                    button.disabled = false;
                    field.readOnly = false;
                    form.setAttribute('aria-busy', 'false');
                    button.textContent = 'Share your perspective';
                }
            });
        });
    }
    window.Perspectives = Object.freeze({ submit, bindForms, MAX_LENGTH });
})();
