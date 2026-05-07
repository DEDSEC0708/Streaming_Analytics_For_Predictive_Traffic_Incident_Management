import React, { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "./ui/sheet";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { http } from "../lib/api";
import { toast } from "sonner";
import { withRipple } from "../lib/ripple";
import { Key, Link as LinkIcon } from "@phosphor-icons/react";

export const SettingsSheet = ({ open, onOpenChange, settings, onSaved }) => {
    const [value, setValue] = useState("");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        const trimmed = value.trim();
        if (trimmed.length < 8) {
            toast.error("Key looks too short. Paste a valid OpenWeather key.");
            return;
        }
        setSaving(true);
        try {
            const { data } = await http.post("/settings", {
                openweather_api_key: trimmed,
            });
            toast.success("OpenWeather key stored.");
            setValue("");
            onSaved?.(data);
        } catch (e) {
            toast.error(
                e.response?.data?.detail || "Failed to save key."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                data-testid="settings-sheet"
                className="bg-[#0F0F0F] border-white/10 rounded-none text-white w-full sm:max-w-md p-0"
            >
                <SheetHeader className="px-6 py-5 border-b border-white/10 text-left">
                    <SheetTitle className="font-mono text-xs uppercase tracking-[0.25em] text-white/80 flex items-center gap-2">
                        <Key size={14} /> Settings / API Configuration
                    </SheetTitle>
                    <SheetDescription className="text-white/50 text-sm">
                        Add your OpenWeather API key to enable live weather
                        fetching by city.
                    </SheetDescription>
                </SheetHeader>

                <div className="p-6 space-y-5">
                    <div className="border border-white/10 p-4 bg-[#050505]">
                        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
                            Current Status
                        </div>
                        <div
                            data-testid="settings-status"
                            className="font-mono text-lg mt-1"
                        >
                            {settings?.configured ? (
                                <span className="text-[#00E676]">
                                    ACTIVE · {settings.key_preview}
                                </span>
                            ) : (
                                <span className="text-[#FFC400]">
                                    NOT_CONFIGURED
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60 mb-2 block">
                            OpenWeather API Key
                        </Label>
                        <Input
                            data-testid="openweather-key-input"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="paste key here"
                            className="bg-[#050505] border-white/20 rounded-none font-mono text-sm h-11 focus-visible:ring-0 focus-visible:border-white"
                        />
                        <Button
                            type="button"
                            onClick={withRipple(save)}
                            disabled={saving}
                            data-testid="save-key-btn"
                            className="group relative overflow-hidden mt-3 rounded-none bg-white text-black hover:bg-white/90 h-11 px-5 font-mono text-xs uppercase tracking-[0.25em] transition-all duration-150 active:scale-[0.97] active:bg-white/70 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {saving ? (
                                <span className="ascii-loader">SAVING</span>
                            ) : (
                                <>
                                    <span>Save Key</span>
                                    <span
                                        aria-hidden
                                        className="ml-2 inline-block transition-transform duration-150 group-hover:translate-x-0.5"
                                    >
                                        →
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="border border-white/10 p-4 bg-[#050505]">
                        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">
                            How to obtain a key
                        </div>
                        <ol className="text-sm text-white/70 space-y-1 list-decimal pl-5">
                            <li>
                                Create a free account at{" "}
                                <a
                                    href="https://openweathermap.org/api"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline text-white inline-flex items-center gap-1"
                                >
                                    openweathermap.org/api{" "}
                                    <LinkIcon size={12} />
                                </a>
                                .
                            </li>
                            <li>
                                Go to <em>API keys</em> in your dashboard.
                            </li>
                            <li>Copy the default key and paste it above.</li>
                        </ol>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
