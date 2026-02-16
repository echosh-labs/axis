const DetailPanel = ({
    title,
    status,
    isKeep,
    detailContent,
    detailItem,
    detailLoading,
    detailError,
    detailRef,
    onExit,
}) => (
    <div className="flex-1 flex flex-col overflow-hidden bg-black/60 m-2 border border-blue-900/30 rounded p-2">
        <div className="flex justify-between items-start text-[10px] mb-2 font-bold uppercase">
            <div className="flex flex-col">
                <span className="text-blue-400">Detail: {title}</span>
                {isKeep && (
                    <span className={`text-[9px] mt-1 ${status === 'Execute' ? 'text-purple-300' : status === 'Complete' ? 'text-emerald-300' : 'text-yellow-300'}`}>
                        Status: {status || 'Pending'}
                    </span>
                )}
            </div>
            <span className="cursor-pointer text-blue-400" onClick={onExit}>[ESC] EXIT</span>
        </div>
        {detailLoading && (
            <div className="flex-1 text-[10px] text-blue-300 overflow-auto scrollbar-hide bg-black/40 p-2">Loading detail...</div>
        )}
        {!detailLoading && detailError && (
            <div className="flex-1 text-[10px] text-red-400 overflow-auto scrollbar-hide bg-black/40 p-2">{detailError}</div>
        )}
        {!detailLoading && !detailError && detailItem && (
            <div ref={detailRef} className="flex-1 flex flex-col gap-2 overflow-auto scrollbar-hide">
                {isKeep && (
                    <div className="border border-emerald-900/40 bg-black/50 p-2 rounded">
                        <div className="text-[9px] uppercase text-emerald-500 mb-1">Body Content</div>
                        <div className="text-[11px] text-emerald-200 whitespace-pre-wrap leading-relaxed select-text">
                            {detailContent || 'No body content.'}
                        </div>
                    </div>
                )}
                <div className="border border-blue-900/40 bg-black/50 p-2 rounded">
                    <div className="text-[9px] uppercase text-blue-400 mb-1">Raw Payload</div>
                    <pre className="text-[10px] text-blue-300 overflow-auto scrollbar-hide bg-black/40 p-2 rounded select-text">
                        {JSON.stringify(detailItem, null, 2)}
                    </pre>
                </div>
            </div>
        )}
        {!detailLoading && !detailError && !detailItem && (
            <div className="flex-1 text-[10px] text-blue-300 overflow-auto scrollbar-hide bg-black/40 p-2">No data available.</div>
        )}
    </div>
);

export default DetailPanel;
