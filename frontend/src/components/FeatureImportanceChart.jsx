import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    LabelList,
} from "recharts";

const LABELS = {
    temperature: "TEMP",
    humidity: "HUMIDITY",
    visibility: "VISIBILITY",
    wind_speed: "WIND",
    hour: "HOUR",
    weather_condition: "WEATHER",
};

export const FeatureImportanceChart = ({ importance, accuracy, nSamples }) => {
    const data = (importance || []).map((i) => ({
        feature: LABELS[i.feature] || i.feature,
        pct: i.importance_pct,
    }));

    return (
        <div
            data-testid="feature-importance-panel"
            className="border border-white/10 bg-[#0F0F0F]"
        >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white/60" aria-hidden />
                    <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-white/80">
                        Model Insights
                    </h2>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                    XGBOOST :: GAIN
                </span>
            </div>

            <div className="grid grid-cols-2 border-b border-white/10">
                <div className="p-5 border-r border-white/10">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
                        Accuracy
                    </div>
                    <div
                        data-testid="model-accuracy"
                        className="font-mono text-3xl mt-1 tabular-nums"
                    >
                        {accuracy != null ? `${(accuracy * 100).toFixed(1)}%` : "--"}
                    </div>
                </div>
                <div className="p-5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
                        Training Samples
                    </div>
                    <div
                        data-testid="model-samples"
                        className="font-mono text-3xl mt-1 tabular-nums"
                    >
                        {nSamples != null ? nSamples.toLocaleString() : "--"}
                    </div>
                </div>
            </div>

            <div className="p-5" style={{ height: 280 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
                        barCategoryGap={8}
                    >
                        <CartesianGrid
                            stroke="rgba(255,255,255,0.05)"
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            domain={[0, "dataMax"]}
                            stroke="rgba(255,255,255,0.3)"
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            type="category"
                            dataKey="feature"
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fontSize: 10 }}
                            width={80}
                        />
                        <Tooltip
                            cursor={{ fill: "rgba(255,255,255,0.04)" }}
                            contentStyle={{
                                background: "#000",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: 0,
                            }}
                            formatter={(v) => [`${v}%`, "importance"]}
                        />
                        <Bar
                            dataKey="pct"
                            fill="#FFFFFF"
                            isAnimationActive={false}
                        >
                            <LabelList
                                dataKey="pct"
                                position="right"
                                formatter={(v) => `${v}%`}
                                fill="rgba(255,255,255,0.6)"
                                style={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
