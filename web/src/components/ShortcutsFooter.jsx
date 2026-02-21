const ShortcutsFooter = ({ mode, secondsRemaining }) => (
    <div className="mt-4 flex justify-between text-[9px] text-gray-600 border-t border-gray-900 pt-2 uppercase italic">
        <span>H: Help | Arrows: Nav | Enter: Inspect | Delete: Kill</span>
        <span className="flex gap-4">
            {mode === 'AUTO' && secondsRemaining !== null && (
                <span className="text-emerald-500 font-bold">NEXT TICK: {secondsRemaining}s</span>
            )}
            <span>Postural Alignment: Neutral Axis</span>
        </span>
    </div>
);

export default ShortcutsFooter;
