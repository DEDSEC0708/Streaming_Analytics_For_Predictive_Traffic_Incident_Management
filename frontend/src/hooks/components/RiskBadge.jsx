import React from "react";

const STYLES = {
    Low: {
        color: "#00E676",
        bg: "rgba(0, 230, 118, 0.1)",
        border: "rgba(0, 230, 118, 0.4)",
    },
    Medium: {
        color: "#FFC400",
        bg: "rgba(255, 196, 0, 0.1)",
        border: "rgba(255, 196, 0, 0.4)",
    },
    High: {
        color: "#FF3B30",
        bg: "rgba(255, 59, 48, 0.1)",
        border: "rgba(255, 59, 48, 0.4)",
    },
};

export const RiskBadge = ({ level, size = "sm", testId }) => {
    const s = STYLES[level] || STYLES.Low;
    const sizing =
        size === "lg"
            ? "px-3 py-1 text-sm"
            : "px-2 py-0.5 text-[10px]";
    return (
        <span
            data-testid={testId}
            className={`inline-flex items-center gap-2 font-mono uppercase tracking-[0.2em] ${sizing} border`}
            style={{
                color: s.color,
                background: s.bg,
                borderColor: s.border,
            }}
        >
            <span
                aria-hidden
                style={{ background: s.color }}
                className="inline-block w-1.5 h-1.5"
            />
            {level}
        </span>
    );
};
