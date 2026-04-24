import React, { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { http } from "../lib/api";
import { WeatherForm } from "../components/WeatherForm";
import { RiskResult } from "../components/RiskResult";
import { FeatureImportanceChart } from "../components/FeatureImportanceChart";
import { HistoryTimeline } from "../components/HistoryTimeline";
import { SettingsSheet } from "../components/SettingsSheet";
import {
    ChartBar,
    Gauge,
    GearSix,
    Path as PathIcon,
    Broadcast,
} from "@phosphor-icons/react";

export default function Dashboard() {
    const [conditions, setConditions] = useState([
        "Clear",
        "Cloudy",
        "Rain",
        "Heavy Rain",
        "Snow",
        "Fog",
        "Thunderstorm",
    ]);
    const [modelInfo, setModelInfo] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [predictLoading, setPredictLoading] = useState(false);
    const [settings, setSettings] = useState({ configured: false });
    const [settingsOpen, setSettingsOpen] = useState(false);

    const stats = useMemo(() => {
        const totals = { Low: 0, Medium: 0, High: 0 };
        for (const h of history) totals[h.risk_level] = (totals[h.risk_level] || 0) + 1;
        return totals;
    }, [history]);

    const refreshHistory = async () => {
        try {
            const { data } = await http.get("/history", { params: { limit: 50 } });
            setHistory(data);
        } catch (e) {
            // silent
        } finally {
            setHistoryLoading(false);
        }
    };

    const refreshSettings = async () => {
        try {
            const { data } = await http.get("/settings");
            setSettings(data);
        } catch (e) {
            // silent
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const [opts, info] = await Promise.all([
                    http.get("/weather-options"),
                    http.get("/model-info"),
                ]);
                setConditions(opts.data.conditions);
                setModelInfo(info.data);
            } catch (e) {
                toast.error("Failed to load model metadata.");
            }
        })();
        refreshHistory();
        refreshSettings();
    }, []);

    const onPredict = async (payload) => {
        setPredictLoading(true);
        try {
            const { data } = await http.post("/predict", payload);
            setPrediction(data);
            toast.success(
                `Risk: ${data.risk_level} (${Math.round(data.confidence * 1000) / 10}% confidence)`
            );
            refreshHistory();
        } catch (e) {
            toast.error(
                e.response?.data?.detail?.toString?.() ||
                    "Prediction failed. Check inputs."
            );
        } finally {
            setPredictLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" data-testid="dashboard">
            <Toaster
                position="top-right"
                theme="dark"
                toastOptions={{
                    style: {
                        background: "#0F0F0F",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 0,
                        color: "#fff",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                    },
                }}
            />

            {/* Sidebar */}
            <aside className="hidden md:flex flex-col justify-between items-center py-6 border-r border-white/10 w-16 lg:w-20 bg-[#0F0F0F]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-8 h-8 border border-white/30 flex items-center justify-center">
                        <span className="font-mono text-xs font-bold">RX</span>
                    </div>
                    <nav className="flex flex-col items-center gap-4 mt-4">
                        <button
                            title="Dashboard"
                            className="p-2 border border-white/20 hover:border-white/60 transition-colors"
                        >
                            <Gauge size={16} />
                        </button>
                        <button
                            title="Charts"
                            className="p-2 border border-transparent hover:border-white/30 transition-colors"
                        >
                            <ChartBar size={16} />
                        </button>
                        <button
                            title="Routes"
                            className="p-2 border border-transparent hover:border-white/30 transition-colors"
                        >
                            <PathIcon size={16} />
                        </button>
                        <button
                            title="Live"
                            className="p-2 border border-transparent hover:border-white/30 transition-colors"
                        >
                            <Broadcast size={16} />
                        </button>
                    </nav>
                </div>
                <button
                    onClick={() => setSettingsOpen(true)}
                    title="Settings"
                    data-testid="open-settings-btn"
                    className="p-2 border border-white/20 hover:border-white/60 transition-colors"
                >
                    <GearSix size={16} />
                </button>
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0">
                {/* Top bar */}
                <header className="border-b border-white/10 bg-[#0F0F0F] px-5 lg:px-8 py-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                            RISK.OPS // v1.0 · xgboost.multiclass
                        </div>
                        <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight mt-1">
                            Traffic Incident Risk Console
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="border border-white/10 px-3 py-2 bg-[#050505]">
                            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
                                Accuracy
                            </div>
                            <div
                                data-testid="hdr-accuracy"
                                className="font-mono text-sm tabular-nums"
                            >
                                {modelInfo
                                    ? `${(modelInfo.accuracy * 100).toFixed(1)}%`
                                    : "--"}
                            </div>
                        </div>
                        <div className="border border-white/10 px-3 py-2 bg-[#050505]">
                            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
                                Samples
                            </div>
                            <div className="font-mono text-sm tabular-nums">
                                {modelInfo
                                    ? modelInfo.n_samples.toLocaleString()
                                    : "--"}
                            </div>
                        </div>
                        <div className="border border-white/10 px-3 py-2 bg-[#050505] flex items-center gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
                                API KEY
                            </span>
                            <span
                                data-testid="hdr-api-status"
                                className={`font-mono text-xs ${settings.configured ? "text-[#00E676]" : "text-[#FFC400]"}`}
                            >
                                {settings.configured ? "ACTIVE" : "NOT SET"}
                            </span>
                        </div>
                        <button
                            data-testid="open-settings-btn-top"
                            onClick={() => setSettingsOpen(true)}
                            className="border border-white/20 hover:border-white/60 transition-colors px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] flex items-center gap-2"
                        >
                            <GearSix size={12} /> Settings
                        </button>
                    </div>
                </header>

                {/* Risk summary strip */}
                <section className="grid grid-cols-3 border-b border-white/10 bg-[#0F0F0F]">
                    {[
                        { k: "Low", color: "#00E676" },
                        { k: "Medium", color: "#FFC400" },
                        { k: "High", color: "#FF3B30" },
                    ].map(({ k, color }, i) => (
                        <div
                            key={k}
                            className={`px-5 lg:px-8 py-4 ${i < 2 ? "border-r border-white/10" : ""}`}
                        >
                            <div
                                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                                style={{ color }}
                            >
                                {k} · CUM
                            </div>
                            <div
                                data-testid={`stat-${k.toLowerCase()}`}
                                className="font-mono text-3xl tabular-nums mt-1"
                            >
                                {stats[k] || 0}
                            </div>
                        </div>
                    ))}
                </section>

                {/* Control room grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 lg:p-8">
                    <div className="lg:col-span-6">
                        <WeatherForm
                            conditions={conditions}
                            onPredict={onPredict}
                            loading={predictLoading}
                            settingsConfigured={settings.configured}
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <RiskResult prediction={prediction} />
                    </div>
                    <div className="lg:col-span-6">
                        <FeatureImportanceChart
                            importance={modelInfo?.feature_importance}
                            accuracy={modelInfo?.accuracy}
                            nSamples={modelInfo?.n_samples}
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <HistoryTimeline
                            items={history}
                            loading={historyLoading}
                        />
                    </div>
                </div>

                <footer className="border-t border-white/10 px-5 lg:px-8 py-5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 flex flex-wrap gap-4 justify-between">
                    <span>rx.ops · xgboost_multiclass · mongo_persisted</span>
                    <span>
                        risk_classes :: low · medium · high · no_hardcoded_output
                    </span>
                </footer>
            </main>

            <SettingsSheet
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                settings={settings}
                onSaved={(s) => setSettings(s)}
            />
        </div>
    );
}
