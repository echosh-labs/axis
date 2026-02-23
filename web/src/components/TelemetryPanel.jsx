// Copyright (c) 2026 Justin Andrew Wood. All rights reserved.
// This software is licensed under the AGPL-3.0.
// Commercial licensing is available at echosh-labs.com.
const TelemetryPanel = ({ logs, scrollRef }) => (
    <div className="w-1/2 flex flex-col border border-gray-900 bg-black/40 p-3 rounded">
        <div className="text-[9px] text-gray-600 mb-2 uppercase border-b border-gray-900 pb-1">Telemetry Buffer</div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 text-[11px] scrollbar-hide">
            {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                    <span className="text-gray-700">[{log.timestamp}]</span>
                    <span className={
                        log.type === 'Error' ? 'text-red-300' :
                            log.type === 'Complete' ? 'text-emerald-300' :
                                log.type === 'Pending' ? 'text-yellow-300' :
                                    log.type === 'Execute' ? 'text-purple-300' :
                                        log.type === 'Active' ? 'text-cyan-300' :
                                            log.type === 'Blocked' ? 'text-orange-300' :
                                                log.type === 'Review' ? 'text-magenta-300' :
                                                    log.type === 'error' ? 'text-red-500' :
                                                        log.type === 'success' ? 'text-emerald-500' :
                                                            log.type === 'system' ? 'text-blue-400' :
                                                                'text-gray-500'
                    }>
                        {log.message}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

export default TelemetryPanel;
