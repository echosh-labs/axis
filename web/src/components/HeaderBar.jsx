const HeaderBar = ({
    user,
    connected,
    mode,
    onSyncMode,
    onRefresh,
    automationTask,
    onAutomationChange,
    onAutomationSubmit,
    automationDisabled,
    automationBusy,
}) => {
    const handleAutomationSubmit = (event) => {
        event.preventDefault();
        onAutomationSubmit?.();
    };

    const handleAutomationChange = (event) => {
        onAutomationChange?.(event.target.value);
    };

    const computedDisabled = automationDisabled || automationBusy;

    return (
        <>
            <div className="mb-4 border border-gray-900 bg-black/60 p-3 rounded flex justify-between items-center">
                <div className="text-lg font-bold tracking-[0.6em] lowercase bg-gradient-to-r from-violet-900 via-purple-700 to-emerald-700 text-transparent bg-clip-text shimmer-text drop-shadow-[0_0_8px_rgba(76,29,149,0.45)]">axis mundi</div>
                <div className="w-full max-w-sm">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 font-bold">
                            {user ? `${user.name} (${user.email})` : 'Syncing user...'}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
                    </div>
                    <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">
                        {user && user.id ? `USER PROFILE: ID#${user.id}` : 'USER PROFILE'}
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center border-b border-gray-900 pb-2 mb-4 text-[10px] tracking-widest uppercase">
                <div className="flex gap-8">
                    <span className={mode === 'AUTO' ? "text-emerald-500 font-bold" : "text-gray-600 cursor-pointer"} onClick={() => onSyncMode('AUTO')}>[A] AUTO</span>
                    <span className={mode === 'MANUAL' ? "text-yellow-600 font-bold" : "text-gray-600 cursor-pointer"} onClick={() => onSyncMode('MANUAL')}>[M] MANUAL</span>
                    <span className={mode === 'MANUAL' ? "text-blue-500 cursor-pointer" : "text-gray-700 cursor-not-allowed"} onClick={() => mode === 'MANUAL' && onRefresh()}>[R] REFRESH</span>
                </div>
                <div className={mode === 'AUTO' ? "text-emerald-400 animate-pulse" : "text-yellow-600"}>STATUS: {mode}</div>
            </div>
            <div className="mb-4 border border-gray-900 bg-black/60 p-3 rounded">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                    <span>Automation Dispatch</span>
                    <span>{mode === 'MANUAL' ? 'Ready' : 'Disabled'}</span>
                </div>
                <form className="flex gap-2" onSubmit={handleAutomationSubmit}>
                    <input
                        type="text"
                        className="flex-1 bg-black/40 border border-gray-800 rounded px-3 py-2 text-[11px] text-gray-200 focus:border-emerald-600 focus:outline-none"
                        placeholder="Describe the task to delegate"
                        value={automationTask}
                        onChange={handleAutomationChange}
                        disabled={automationDisabled}
                    />
                    <button
                        type="submit"
                        disabled={computedDisabled || !automationTask?.trim()}
                        className={`px-4 py-2 text-[10px] tracking-[0.3em] uppercase rounded border transition ${computedDisabled || !automationTask?.trim()
                            ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                            : 'border-emerald-600 text-emerald-400 hover:bg-emerald-600/10'
                        }`}
                    >
                        {automationBusy ? 'Dispatching' : 'Send Task'}
                    </button>
                </form>
                {automationDisabled && (
                    <div className="text-[9px] text-yellow-600 uppercase tracking-wide mt-2">Switch to MANUAL to enable dispatch.</div>
                )}
            </div>
        </>
    );
};

export default HeaderBar;
