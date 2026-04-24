import React, { useState } from "react";
import { http } from "../lib/api";
import { toast } from "sonner";
import { withRipple } from "../lib/ripple";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { DownloadSimple, Lightning, MapPin } from "@phosphor-icons/react";

const DEFAULTS = {
    temperature: 18,
    humidity: 65,
    visibility: 8,
    wind_speed: 12,
    hour: new Date().getHours(),
    weather_condition: "Clear",
};

const FIELDS = [
    { name: "temperature", label: "TEMPERATURE", unit: "°C", step: 0.1, min: -60, max: 60 },
    { name: "humidity", label: "HUMIDITY", unit: "%", step: 1, min: 0, max: 100 },
    { name: "visibility", label: "VISIBILITY", unit: "KM", step: 0.1, min: 0, max: 50 },
    { name: "wind_speed", label: "WIND SPEED", unit: "KPH", step: 0.1, min: 0, max: 250 },
    { name: "hour", label: "HOUR (24H)", unit: "", step: 1, min: 0, max: 23 },
];

export const WeatherForm = ({
    conditions,
    onPredict,
    loading,
    settingsConfigured,
}) => {
    const [values, setValues] = useState(DEFAULTS);
    const [city, setCity] = useState("");
    const [fetchingLive, setFetchingLive] = useState(false);
    const [source, setSource] = useState("manual");
    const [lastCity, setLastCity] = useState(null);

    const update = (name, v) => setValues((p) => ({ ...p, [name]: v }));

    const fetchLive = async () => {
        if (!city.trim()) {
            toast.error("Enter a city to fetch live weather.");
            return;
        }
        if (!settingsConfigured) {
            toast.error("Configure OpenWeather API key in Settings first.");
            return;
        }
        setFetchingLive(true);
        try {
            const { data } = await http.get("/live-data", {
                params: { city: city.trim() },
            });
            setValues({
                temperature: data.temperature,
                humidity: data.humidity,
                visibility: data.visibility,
                wind_speed: data.wind_speed,
                hour: data.hour,
                weather_condition: data.weather_condition,
            });
            setSource("live");
            setLastCity(`${data.city}${data.country ? `, ${data.country}` : ""}`);
            toast.success(
                `Loaded live weather for ${data.city}${data.country ? `, ${data.country}` : ""} (${data.weather_description || data.weather_condition})`
            );
        } catch (e) {
            toast.error(
                e.response?.data?.detail || "Failed to fetch live weather."
            );
        } finally {
            setFetchingLive(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        const payload = {
            ...values,
            temperature: Number(values.temperature),
            humidity: Number(values.humidity),
            visibility: Number(values.visibility),
            wind_speed: Number(values.wind_speed),
            hour: Number(values.hour),
            source,
            city: source === "live" ? lastCity : null,
        };
        await onPredict(payload);
        setSource("manual");
    };

    return (
        <form
            onSubmit={submit}
            data-testid="weather-input-form"
            className="border border-white/10 bg-[#0F0F0F]"
        >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white/60" aria-hidden />
                    <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-white/80">
                        Input Conditions
                    </h2>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                    {source === "live" ? "LIVE / OPENWEATHER" : "MANUAL"}
                </span>
            </div>

            {/* Live fetch row */}
            <div className="p-5 border-b border-white/10 grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-8">
                    <Label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2 block">
                        Fetch Live Weather
                    </Label>
                    <div className="flex gap-0">
                        <div className="relative flex-1">
                            <MapPin
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                            />
                            <Input
                                data-testid="city-input"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="City name (e.g. London, Tokyo, Mumbai)"
                                className="pl-9 bg-[#050505] border-white/20 rounded-none font-mono text-sm h-10 focus-visible:ring-0 focus-visible:border-white"
                            />
                        </div>
                        <Button
                            type="button"
                            data-testid="fetch-live-btn"
                            onClick={withRipple(fetchLive)}
                            disabled={fetchingLive}
                            className="group relative overflow-hidden rounded-none bg-white text-black hover:bg-white/90 h-10 px-4 font-mono text-xs uppercase tracking-[0.2em] border-l-0 transition-all duration-150 active:scale-[0.97] active:bg-white/70 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {fetchingLive ? (
                                <span className="ascii-loader">FETCHING</span>
                            ) : (
                                <>
                                    <DownloadSimple
                                        size={14}
                                        className="mr-2 transition-transform duration-150 group-hover:translate-y-0.5"
                                    />
                                    Pull
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-4 flex md:justify-end md:items-end">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                        {settingsConfigured
                            ? "KEY_STATUS :: ACTIVE"
                            : "KEY_STATUS :: NOT_CONFIGURED"}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-white/10">
                {FIELDS.map((f, idx) => (
                    <div
                        key={f.name}
                        className={`p-5 border-white/10 ${idx % 2 === 0 ? "md:border-r" : ""} ${idx < FIELDS.length - 2 ? "border-b md:border-b" : idx < FIELDS.length - 1 ? "border-b md:border-b-0" : ""}`}
                    >
                        <Label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2 block">
                            {f.label}
                        </Label>
                        <div className="flex items-baseline gap-2">
                            <Input
                                type="number"
                                step={f.step}
                                min={f.min}
                                max={f.max}
                                value={values[f.name]}
                                data-testid={`input-${f.name}`}
                                onChange={(e) => {
                                    update(f.name, e.target.value);
                                    setSource("manual");
                                }}
                                className="bg-[#050505] border-white/20 rounded-none font-mono text-lg h-11 focus-visible:ring-0 focus-visible:border-white tabular-nums"
                                required
                            />
                            {f.unit && (
                                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                                    {f.unit}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                <div className="p-5">
                    <Label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2 block">
                        Weather Condition
                    </Label>
                    <Select
                        value={values.weather_condition}
                        onValueChange={(v) => {
                            update("weather_condition", v);
                            setSource("manual");
                        }}
                    >
                        <SelectTrigger
                            data-testid="input-weather_condition"
                            className="bg-[#050505] border-white/20 rounded-none font-mono text-sm h-11 focus:ring-0"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none bg-[#0F0F0F] border-white/20">
                            {conditions.map((c) => (
                                <SelectItem
                                    key={c}
                                    value={c}
                                    className="font-mono text-sm rounded-none focus:bg-white/10"
                                >
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="p-5 flex items-center gap-4">
                <Button
                    type="submit"
                    data-testid="predict-btn"
                    onClick={withRipple(undefined)}
                    disabled={loading}
                    className="group relative overflow-hidden rounded-none bg-white text-black hover:bg-white/90 h-12 px-6 font-mono text-xs uppercase tracking-[0.25em] transition-all duration-150 active:scale-[0.98] active:bg-white/70 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                    <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-0 bg-black/5 transition-[width] duration-300 ease-out group-hover:w-full"
                    />
                    <Lightning
                        size={14}
                        weight="bold"
                        className="mr-2 relative z-10 transition-transform duration-150 group-hover:translate-x-0.5"
                    />
                    <span className="relative z-10">
                        {loading ? (
                            <span className="ascii-loader">PREDICTING</span>
                        ) : (
                            "Run Prediction"
                        )}
                    </span>
                </Button>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                    MODEL :: XGBOOST_MULTICLASS
                </span>
            </div>
        </form>
    );
};
