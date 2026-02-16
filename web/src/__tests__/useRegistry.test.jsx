import { renderHook } from '@testing-library/react';
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
    close() {}
}

beforeAll(() => {
    global.EventSource = FakeEventSource;
});

describe('useRegistry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('cycles status forward and back', () => {
        const { result } = renderHook(() => useRegistry());
        expect(result.current.nextStatus('Pending', 'forward')).toBe('Execute');
        expect(result.current.nextStatus('Execute', 'forward')).toBe('Complete');
        expect(result.current.nextStatus('Complete', 'forward')).toBe('Pending');
        expect(result.current.nextStatus('Execute', 'back')).toBe('Pending');
        expect(result.current.nextStatus('Complete', 'back')).toBe('Execute');
        expect(result.current.nextStatus('Pending', 'back')).toBe('Complete');
    });

    it('exposes registry defaults without crashing', () => {
        const { result } = renderHook(() => useRegistry());
        expect(result.current.registry).toEqual([]);
        expect(result.current.mode).toBeDefined();
    });
});
