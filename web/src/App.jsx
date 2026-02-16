import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HeaderBar from './components/HeaderBar.jsx';
import TelemetryPanel from './components/TelemetryPanel.jsx';
import RegistryList from './components/RegistryList.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import ShortcutsFooter from './components/ShortcutsFooter.jsx';
import { useRegistry } from './hooks/useRegistry.js';
import { useHotkeys } from './hooks/useHotkeys.js';

const App = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showDetail, setShowDetail] = useState(false);
    const [logs, setLogs] = useState([
        { timestamp: new Date().toLocaleTimeString(), type: 'system', message: 'Axis TUI Initialized. Mode: MANUAL' }
    ]);
    const [detailItem, setDetailItem] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const scrollRef = useRef(null);
    const registryRef = useRef(null);
    const detailRef = useRef(null);

    const addLog = useCallback((type, message) => {
        setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type, message }]);
    }, []);

    const handleRegistryChange = useCallback((list) => {
        setSelectedIndex((prev) => {
            if (list.length === 0) return 0;
            return Math.min(prev, list.length - 1);
        });
    }, []);

    const {
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
    } = useRegistry({ addLog, onRegistryChange: handleRegistryChange });

    useEffect(() => {
        if (!registryRef.current || showDetail) return;
        const listContainer = registryRef.current;
        const selectedElement = listContainer.children[selectedIndex];
        if (!selectedElement) return;

        if (selectedIndex === 0) {
            listContainer.scrollTop = 0;
            return;
        }

        if (selectedIndex === registry.length - 1) {
            listContainer.scrollTop = listContainer.scrollHeight;
            return;
        }

        selectedElement.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex, registry.length, showDetail]);

    const closeDetail = useCallback(() => {
        setShowDetail(false);
        setDetailItem(null);
        setDetailError(null);
        setDetailLoading(false);
    }, []);

    const setDetailVisibility = useCallback((value) => {
        if (!value) {
            closeDetail();
        } else {
            setShowDetail(true);
        }
    }, [closeDetail]);

    const handleInspect = useCallback(async () => {
        if (registry.length === 0) return;
        const target = registry[selectedIndex];
        if (!target) return;

        setShowDetail(true);
        setDetailLoading(true);
        setDetailItem(null);
        setDetailError(null);

        try {
            const data = await fetchDetail(target);
            setDetailItem(data);
            addLog('success', `Detail pulled for ${target.type}: ${target.id}`);
        } catch (err) {
            setDetailError(err.message || `Failed to load detail for ${target?.type || 'item'}.`);
            addLog('error', `Detail retrieval failed for: ${target?.id || 'unknown'}`);
        } finally {
            setDetailLoading(false);
        }
    }, [registry, selectedIndex, fetchDetail, addLog]);

    const handleDelete = useCallback(() => {
        const target = registry[selectedIndex];
        if (!target) return;
        deleteItem(target);
        if (showDetail) closeDetail();
    }, [registry, selectedIndex, deleteItem, showDetail, closeDetail]);

    const handleCycleStatus = useCallback((direction) => {
        if (registry.length === 0) return;
        const currentItem = registry[selectedIndex];
        if (!currentItem || currentItem.type !== 'keep') return;

        const newStatus = nextStatus(currentItem.status || 'Pending', direction === 'forward' ? 'forward' : 'back');
        setRegistry(prev => prev.map(item => item.id === currentItem.id ? { ...item, status: newStatus } : item));

        updateStatus(currentItem, newStatus).catch(() => {
            setRegistry(prev => prev.map(item => item.id === currentItem.id ? { ...item, status: currentItem.status || 'Pending' } : item));
        });
    }, [registry, selectedIndex, nextStatus, setRegistry, updateStatus]);

    const handleSelectNext = useCallback(() => {
        setSelectedIndex((prev) => {
            if (registry.length === 0) return 0;
            return (prev + 1) % registry.length;
        });
    }, [registry.length]);

    const handleSelectPrev = useCallback(() => {
        setSelectedIndex((prev) => {
            if (registry.length === 0) return 0;
            return (prev - 1 + registry.length) % registry.length;
        });
    }, [registry.length]);

    useHotkeys({
        mode,
        showDetail,
        setShowDetail: setDetailVisibility,
        onSyncMode: syncMode,
        onRefresh: fetchRegistry,
        onSelectNext: handleSelectNext,
        onSelectPrev: handleSelectPrev,
        onInspect: handleInspect,
        onDelete: handleDelete,
        onCycleStatus: handleCycleStatus,
        detailRef,
        detailScrollStep: 50,
    });

    const formatNoteContent = useMemo(() => {
        const firstDefined = (obj, keys) => {
            if (!obj) return undefined;
            for (const key of keys) {
                if (obj[key] !== undefined && obj[key] !== null) return obj[key];
            }
            return undefined;
        };
        const normalizeString = (value) => {
            if (typeof value === 'string') return value;
            if (!value) return '';
            if (typeof value.text === 'string') return value.text;
            if (typeof value.Text === 'string') return value.Text;
            if (typeof value.value === 'string') return value.value;
            return '';
        };

        return {
            fromNote(note) {
                const section = firstDefined(note, ['body', 'Body']);
                if (!section) return 'No body content.';

                const text = normalizeString(firstDefined(section, ['text', 'Text']));
                if (text.trim() !== '') return text;

                const list = firstDefined(section, ['list', 'List']);
                const itemsList = firstDefined(list, ['listItems', 'ListItems']);
                const items = Array.isArray(itemsList) ? itemsList : [];
                
                if (items.length > 0) {
                    const lines = [];
                    const walk = (entries, depth) => {
                        entries.forEach((entry) => {
                            const raw = normalizeString(firstDefined(entry, ['text', 'Text']));
                            const label = raw.trim() === '' ? '[Empty]' : raw;
                            const isChecked = firstDefined(entry, ['checked', 'Checked']);
                            const checkedMarker = isChecked ? ' [x]' : '';
                            lines.push(`${'  '.repeat(depth)}- ${label}${checkedMarker}`);
                            const children = firstDefined(entry, ['childListItems', 'ChildListItems']);
                            if (Array.isArray(children) && children.length > 0) walk(children, depth + 1);
                        });
                    };
                    walk(items, 0);
                    return lines.join('\n');
                }
                return 'No body content.';
            },
        };
    }, []);

    const detailContent = useMemo(() => {
        if (!detailItem) return '';
        const selectedItem = registry[selectedIndex];
        if (selectedItem && selectedItem.type === 'keep') {
            return formatNoteContent.fromNote(detailItem);
        }
        return 'Detail view not applicable for this item type.';
    }, [detailItem, formatNoteContent, registry, selectedIndex]);

    const getTagStyles = (tag) => {
        switch (tag) {
            case 'keep':
            case 'Pending':
                return 'border-yellow-700/60 text-yellow-300';
            case 'Execute':
                return 'border-purple-700/60 text-purple-300';
            case 'Complete':
                return 'border-emerald-700/60 text-emerald-300';
            case 'doc': return 'border-blue-700/60 text-blue-300';
            case 'sheet': return 'border-green-700/60 text-green-300';
            default: return 'border-gray-700/60 text-gray-300';
        }
    };

    return (
        <div className="flex flex-col h-screen p-4 select-text relative outline-none" tabIndex="0">
            <HeaderBar
                user={user}
                connected={connected}
                mode={mode}
                onSyncMode={syncMode}
                onRefresh={fetchRegistry}
            />

            <div className="flex flex-1 gap-4 overflow-hidden">
                <TelemetryPanel logs={logs} scrollRef={scrollRef} />

                <div className="w-1/2 flex flex-col border border-gray-900 bg-black/40 rounded overflow-hidden relative">
                    <div className="text-[9px] text-gray-600 uppercase border-b border-gray-900 p-2 flex justify-between bg-black/60 z-10">
                        <span>Unified Registry</span>
                        <span className="text-[8px] text-gray-700">{connected ? 'LIVE STREAM' : 'DISCONNECTED'}</span>
                    </div>
                    {!showDetail ? (
                        <RegistryList
                            registry={registry}
                            selectedIndex={selectedIndex}
                            mode={mode}
                            registryRef={registryRef}
                            getTagStyles={getTagStyles}
                        />
                    ) : (
                        <DetailPanel
                            title={registry[selectedIndex]?.title || 'Unknown'}
                            status={registry[selectedIndex]?.status || 'Pending'}
                            isKeep={registry[selectedIndex]?.type === 'keep'}
                            detailContent={detailContent}
                            detailItem={detailItem}
                            detailLoading={detailLoading}
                            detailError={detailError}
                            detailRef={detailRef}
                            onExit={closeDetail}
                        />
                    )}
                </div>
            </div>

            <ShortcutsFooter mode={mode} secondsRemaining={secondsRemaining} />
        </div>
    );
};

export default App;
