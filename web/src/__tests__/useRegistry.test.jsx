import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { useRegistry } from '../hooks/useRegistry.js';

vi.mock('../utils/fetchJson', () => ({
    fetchJson: vi.fn(async (url) => {
        if (url.includes('/api/user')) return { id: 'u1', name: 'Test User' };
        if (url.includes('/api/mode')) return { mode: 'MANUAL' };
        if (url.includes('/api/registry')) return [];
        return {};
    })
}));

class FakeEventSource {
    constructor(url) {
        this.url = url;
        this.onopen = null;
        this.onerror = null;
        this.listeners = {};
        setTimeout(() => {
            if (this.onopen) this.onopen();
        }, 0);
    }
    addEventListener(type, handler) {
        this.listeners[type] = handler;
    }
    close() { }
}

beforeAll(() => {
    global.EventSource = FakeEventSource;
});

describe('useRegistry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn(async () => ({ ok: true })); // mock raw fetch for updateStatus
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('cycles status forward and back', () => {
        const { result } = renderHook(() => useRegistry());
        // Forward cycle
        expect(result.current.nextStatus('Pending', 'forward')).toBe('Execute');
        expect(result.current.nextStatus('Execute', 'forward')).toBe('Active');
        expect(result.current.nextStatus('Active', 'forward')).toBe('Blocked');
        expect(result.current.nextStatus('Blocked', 'forward')).toBe('Review');
        expect(result.current.nextStatus('Review', 'forward')).toBe('Complete');
        expect(result.current.nextStatus('Complete', 'forward')).toBe('Error');
        expect(result.current.nextStatus('Error', 'forward')).toBe('Pending');

        // Backward cycle
        expect(result.current.nextStatus('Pending', 'back')).toBe('Error');
        expect(result.current.nextStatus('Error', 'back')).toBe('Complete');
        expect(result.current.nextStatus('Complete', 'back')).toBe('Review');
        expect(result.current.nextStatus('Review', 'back')).toBe('Blocked');
        expect(result.current.nextStatus('Blocked', 'back')).toBe('Active');
        expect(result.current.nextStatus('Active', 'back')).toBe('Execute');
        expect(result.current.nextStatus('Execute', 'back')).toBe('Pending');
    });

    it('exposes registry defaults without crashing', () => {
        const { result } = renderHook(() => useRegistry());
        expect(result.current.registry).toEqual([]);
        expect(result.current.mode).toBeDefined();
    });

    it('fetches registry manually', async () => {
        const { result } = renderHook(() => useRegistry());
        await act(async () => {
            await result.current.fetchRegistry();
        });
        expect(result.current.registry).toEqual([]);
    });

    it('syncs mode', async () => {
        const { result } = renderHook(() => useRegistry());
        await new Promise(r => setTimeout(r, 10)); // wait for init to finish
        await act(async () => {
            await result.current.syncMode('AUTO');
        });
        expect(result.current.mode).toBe('AUTO');
    });

    it('handles delete resource silently', async () => {
        const { result } = renderHook(() => useRegistry());
        await expect(result.current.deleteItem({ id: 'notes/1', type: 'keep' })).resolves.not.toThrow();
    });

    it('handles update status silently', async () => {
        const { result } = renderHook(() => useRegistry());
        await expect(result.current.updateStatus({ id: 'notes/1', type: 'keep' }, 'Complete')).resolves.not.toThrow();
    });
});
