export async function fetchJson(url, options = {}) {
    const { timeout = 8000, retry = 0, retryDelay = 250, ...rest } = options;

    const attempt = async (remaining) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
            const res = await fetch(url, { ...rest, signal: controller.signal });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                const error = new Error(`Request failed: ${res.status}`);
                error.status = res.status;
                error.body = text;
                throw error;
            }
            // Gracefully handle empty bodies
            const txt = await res.text();
            if (!txt) return {};
            return JSON.parse(txt);
        } catch (err) {
            if (remaining > 0 && (err.name === 'AbortError' || (err.status && err.status >= 500))) {
                await new Promise(r => setTimeout(r, retryDelay));
                return attempt(remaining - 1);
            }
            throw err;
        } finally {
            clearTimeout(timer);
        }
    };

    return attempt(retry);
}
