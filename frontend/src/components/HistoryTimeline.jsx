import React from "react";
import { RiskBadge } from "./RiskBadge";

const fmt = (iso) => {
    try {
        const d = new Date(iso);
        const date = d.toLocaleDateString(undefined, {
            month: "short",
            day: "2-digit",
        });
        const time = d.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${date} · ${time}`;
    } catch {
        return iso;
    }
};

export const HistoryTimeline = ({ items, loading }) => {
    return (
        <div
            data-testid="history-panel"
            className="border border-white/10 bg-[#0F0F0F]"
        >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white/60" aria-hidden />
                    <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-white/80">
                        Prediction Log
                    </h2>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                    N = {items?.length ?? 0}
                </span>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
                {loading && (
                    <div className="p-5 font-mono text-xs uppercase tracking-[0.2em] text-white/40 ascii-loader">
                        [ LOADING_LOG ]
                    </div>
                )}
                {!loading && (!items || items.length === 0) && (
                    <div
                        data-testid="history-empty"
                        className="p-5 font-mono text-xs uppercase tracking-[0.2em] text-white/40"
                    >
                        [ NO_ENTRIES ] Run a prediction to populate the log.
                    </div>
                )}
                <ul className="relative">
                    {items?.map((it, idx) => (
                        <li
                            key={it.id}
                            data-testid={`history-item-${idx}`}
                            className={`relative grid grid-cols-12 gap-3 px-5 py-4 border-white/10 ${idx !== items.length - 1 ? "border-b" : ""}`}
                        >
                            <div className="col-span-12 md:col-span-4 flex items-start gap-3">
                                <span
                                    aria-hidden
                                    className="mt-1.5 w-2 h-2"
                                    style={{
                                        background:
                                            it.risk_level === "Low"
                                                ? "#00E676"
                                                : it.risk_level === "Medium"
                                                  ? "#FFC400"
                                                  : "#FF3B30",
                                    }}
                                />
                                <div>
                                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
                                        {fmt(it.timestamp)}
                                    </div>
                                    <div className="mt-1">
                                        <RiskBadge level={it.risk_level} />
                                    </div>
                                    {it.city && (
                                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">
                                            {it.city}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-8 font-mono text-[11px] text-white/60 tabular-nums grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                                <span>
                                    <span className="text-white/40">T=</span>
                                    {it.inputs.temperature}°C
                                </span>
                                <span>
                                    <span className="text-white/40">H=</span>
                                    {it.inputs.humidity}%
                                </span>
                                <span>
                                    <span className="text-white/40">V=</span>
                                    {it.inputs.visibility}km
                                </span>
                                <span>
                                    <span className="text-white/40">W=</span>
                                    {it.inputs.wind_speed}kph
                                </span>
                                <span>
                                    <span className="text-white/40">HR=</span>
                                    {String(it.inputs.hour).padStart(2, "0")}:00
                                </span>
                                <span className="uppercase">
                                    <span className="text-white/40">WX=</span>
                                    {it.inputs.weather_condition}
                                </span>
                                <span className="col-span-2 md:col-span-3 text-white/40">
                                    source :: {it.source} · conf={" "}
                                    {Math.round(it.confidence * 1000) / 10}%
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
