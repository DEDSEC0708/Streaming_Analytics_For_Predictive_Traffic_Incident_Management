import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
} from "recharts";

const RISK = {
    Low: "#00E676",
    Medium: "#FFC400",
    High: "#FF3B30",
};

const RISK_BG = {
    Low: "rgba(0, 230, 118, 0.08)",
    Medium: "rgba(255, 196, 0, 0.08)",
    High: "rgba(255, 59, 48, 0.08)",
};

const RISK_BORDER = {
    Low: "rgba(0, 230, 118, 0.5)",
    Medium: "rgba(255, 196, 0, 0.5)",
    High: "rgba(255, 59, 48, 0.5)",
};

export const RiskResult = ({ prediction, loading }) => {
    if (loading) {
        return (
            <div
                data-testid="risk-result-loading"
                className="border border-white/10 bg-[#0F0F0F] p-6 md:p-8 min-h-[360px] reveal"
            >
                <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 ascii-loader">
                        Computing
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
                        MODEL :: RUNNING
                    </span>
                </div>
                <div className="skeleton h-16 w-60 border border-white/5" />
                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <div className="skeleton h-3 w-24 border border-white/5" />
                    <div className="skeleton h-4 w-full border border-white/5" />
                    <div className="skeleton h-4 w-[80%] border border-white/5" />
                    <div className="skeleton h-4 w-[55%] border border-white/5" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-0 border border-white/10">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={`p-3 ${i < 2 ? "border-r border-white/10" : ""}`}
                        >
                            <div className="skeleton h-3 w-12 border border-white/5" />
                            <div className="skeleton h-6 w-16 mt-2 border border-white/5" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!prediction) {
        return (
            <div
                data-testid="risk-result-empty"
                className="border border-white/10 bg-[#0F0F0F] p-8 flex flex-col justify-center items-start min-h-[360px] reveal"
            >
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                    Awaiting Input
                </span>
                <p className="font-mono text-5xl mt-4 text-white/20 tracking-tighter">
                    [ ---- ]
                </p>
                <p className="text-sm text-white/50 mt-3 max-w-md">
                    Provide weather conditions on the left and run prediction to see
                    the computed road-safety risk level with class probabilities.
                </p>
            </div>
        );
    }

    const level = prediction.risk_level;
    const color = RISK[level];
    const bg = RISK_BG[level];
    const border = RISK_BORDER[level];
    const data = ["Low", "Medium", "High"].map((k) => ({
        class: k,
        probability: Math.round((prediction.probabilities[k] || 0) * 1000) / 10,
    }));

    return (
        <div
            data-testid="risk-result"
            key={prediction.id}
            className="border bg-[#0F0F0F] p-6 md:p-8 reveal-card min-h-[360px]"
            style={{ borderColor: border, background: bg }}
        >
            <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">
                    Predicted Risk Level
                </span>
                <span
                    data-testid="risk-confidence"
                    className="font-mono text-[10px] uppercase tracking-[0.25em]"
                    style={{ color }}
                >
                    CONFIDENCE :: {Math.round(prediction.confidence * 1000) / 10}%
                </span>
            </div>

            <div className="flex items-baseline gap-4 flex-wrap">
                <h1
                    data-testid="risk-level-value"
                    className="font-mono font-bold tracking-tighter text-6xl md:text-7xl leading-none risk-pop"
                    style={{ color }}
                >
                    {level.toUpperCase()}
                </h1>
                <span
                    aria-hidden
                    className="inline-block w-3 h-3"
                    style={{ background: color }}
                />
            </div>

            {/* Confidence bar — pure CSS width grow */}
            <div className="mt-5">
                <div
                    className="h-1 w-full bg-white/5"
                    data-testid="confidence-bar"
                >
                    <div
                        className="h-full bar-grow"
                        style={{
                            background: color,
                            "--to-width": `${prediction.confidence * 100}%`,
                        }}
                    />
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">
                        Class Probability Distribution
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                        %
                    </span>
                </div>
                <div
                    data-testid="risk-probabilities-chart"
                    style={{ width: "100%", height: 160 }}
                >
                    <ResponsiveContainer>
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
                            barCategoryGap={6}
                        >
                            <CartesianGrid
                                stroke="rgba(255,255,255,0.05)"
                                horizontal={false}
                            />
                            <XAxis
                                type="number"
                                domain={[0, 100]}
                                stroke="rgba(255,255,255,0.3)"
                                tick={{ fontSize: 10 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="class"
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fontSize: 10 }}
                                width={70}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                                contentStyle={{
                                    background: "#000",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    borderRadius: 0,
                                }}
                                formatter={(v) => [`${v}%`, "probability"]}
                            />
                            <Bar
                                dataKey="probability"
                                isAnimationActive
                                animationDuration={300}
                                animationEasing="ease-out"
                            >
                                {data.map((d, i) => (
                                    <Cell
                                        key={d.class}
                                        fill={RISK[d.class]}
                                        // staggered grow via begin
                                        // (Recharts passes animationBegin via bar prop; approximated by index * step below)
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-0 border border-white/10">
                {["Low", "Medium", "High"].map((k, i) => {
                    const pct =
                        Math.round((prediction.probabilities[k] || 0) * 1000) / 10;
                    return (
                        <div
                            key={k}
                            className={`relative p-3 overflow-hidden ${i < 2 ? "border-r border-white/10" : ""}`}
                        >
                            <div
                                className="font-mono text-[10px] uppercase tracking-[0.25em]"
                                style={{ color: RISK[k] }}
                            >
                                {k}
                            </div>
                            <div
                                data-testid={`prob-${k.toLowerCase()}`}
                                className="font-mono text-xl mt-1 tabular-nums"
                            >
                                {pct}%
                            </div>
                            {/* staggered width fill */}
                            <div
                                aria-hidden
                                className="absolute left-0 bottom-0 h-0.5 bar-grow"
                                style={{
                                    background: RISK[k],
                                    opacity: 0.6,
                                    animationDelay: `${40 + i * 40}ms`,
                                    "--to-width": `${pct}%`,
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
