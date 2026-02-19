import { useState, useEffect, useCallback } from 'react';
import {
    getMode,
    setMode as apiSetMode,
    getRegistry as apiGetRegistry,
    getDetail as apiGetDetail,
    deleteResource,
    setStatus as apiSetStatus,
    getUser,
    normalizeRegistry,
    dispatchAutomation as apiDispatchAutomation,
} from '../utils/apiClient';

const STATUS_CYCLE = ['Pending', 'Execute', 'Active', 'Blocked', 'Review', 'Complete', 'Error'];

export function useRegistry({ addLog, onRegistryChange } = {}) {
    const [mode, setMode] = useState('MANUAL');
    const [registry, setRegistry] = useState([]);
    const [user, setUser] = useState(null);
    const [connected, setConnected] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(null);

    const syncMode = useCallback(async (newMode) => {
        setMode(newMode);
        try {
            await apiSetMode(newMode);
        } catch {
            addLog?.('error', `Failed to sync mode ${newMode}`);
        }
    }, [addLog]);

    const fetchRegistry = useCallback(async () => {
        try {
            const normalized = await apiGetRegistry();
            setRegistry(normalized);
            onRegistryChange?.(normalized);
            addLog?.('success', 'Manual registry refresh.');
        } catch {
            addLog?.('error', 'Failed to retrieve registry.');
        }
    }, [addLog, onRegistryChange]);

    const fetchDetail = useCallback(async (item) => apiGetDetail(item), []);

    const deleteItem = useCallback(async (item) => {
        try {
            await deleteResource(item);
            addLog?.('success', `Object purged (${item?.type || 'item'}): ${item?.id || 'unknown'}`);
        } catch {
            addLog?.('error', `Purge failed for ${item?.type || 'item'}: ${item?.id || 'unknown'}`);
        }
    }, [addLog]);

    const updateStatus = useCallback(async (item, status) => {
        if (!item || !item.id) return;
        try {
            await apiSetStatus(item, status);
        } catch (err) {
            addLog?.('error', 'Failed to save status');
            throw err;
        }
    }, [addLog]);

    const dispatchAutomationTask = useCallback(async (task) => {
        const trimmed = task?.trim();
        if (!trimmed) {
            const err = new Error('Task required');
            addLog?.('error', 'Automation task missing');
            throw err;
        }
        try {
            await apiDispatchAutomation(trimmed);
            addLog?.('success', `Automation dispatched: ${trimmed}`);
        } catch (err) {
            addLog?.('error', `Automation dispatch failed: ${trimmed}`);
            throw err;
        }
    }, [addLog]);

    const nextStatus = useCallback((current, direction) => {
        const idx = STATUS_CYCLE.indexOf(current);
        const safeIdx = idx === -1 ? 0 : idx;
        if (direction === 'forward') {
            return STATUS_CYCLE[(safeIdx + 1) % STATUS_CYCLE.length];
        }
        return STATUS_CYCLE[(safeIdx - 1 + STATUS_CYCLE.length) % STATUS_CYCLE.length];
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const userData = await getUser();
                setUser(userData);
            } catch {
                /* swallow init user errors */
            }

            try {
                const modeData = await getMode();
                if (modeData?.mode) {
                    setMode(modeData.mode);
                    addLog?.('system', `State asserted: ${modeData.mode}`);
                }
            } catch {
                /* swallow init mode errors */
            }
        };
        init();
    }, [addLog]);

    useEffect(() => {
        const es = new EventSource('/api/events');
        es.onopen = () => { setConnected(true); addLog?.('success', 'Uplink established (SSE).'); };
        es.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                const normalized = normalizeRegistry(data);
                setRegistry(normalized);
                onRegistryChange?.(normalized);
                setSecondsRemaining(60);
            } catch (err) { console.error('Stream parse error', err); }
        };

        es.addEventListener('tick', (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.seconds_remaining !== undefined) {
                    setSecondsRemaining(data.seconds_remaining);
                }
            } catch (err) { console.error('Tick parse error', err); }
        });

        es.addEventListener('status', (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.status && data.title) {
                    const logType = data.status;
                    addLog?.(logType, `Status → ${data.status}: ${data.title}`);
                }
            } catch (err) { console.error('Status event parse error', err); }
        });

        es.addEventListener('automation', (e) => {
            try {
                const data = JSON.parse(e.data);
                if (!data.task) return;
                const tone = data.state === 'error' ? 'error' : 'system';
                const stateLabel = data.state ? data.state.toUpperCase() : 'UPDATE';
                const suffix = data.error ? ` (${data.error})` : '';
                addLog?.(tone, `Automation ${stateLabel}: ${data.task}${suffix}`);
            } catch (err) { console.error('Automation event parse error', err); }
        });

        es.onerror = () => setConnected(false);
        return () => { es.close(); setConnected(false); };
    }, [addLog, onRegistryChange]);

    return {
        mode,
        registry,
        setRegistry,
        user,
        connected,
        secondsRemaining,
        syncMode,
        fetchRegistry,
        fetchDetail,
        deleteItem,
        updateStatus,
        nextStatus,
        dispatchAutomationTask,
    };
}
