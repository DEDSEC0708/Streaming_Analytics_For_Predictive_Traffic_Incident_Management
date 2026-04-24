/** Lightweight click-ripple helper — pure DOM, no deps.
 *  Paints a radial fade burst at the click point that dissipates in ~500 ms.
 *  Usage:  <button className="relative overflow-hidden" onClick={withRipple(handler)} />
 */

export const spawnRipple = (event, variant = "dark") => {
    const host = event.currentTarget;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const dot = document.createElement("span");
    dot.className = `ripple-dot${variant === "light" ? " ripple-dot--light" : ""}`;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.left = `${event.clientX - rect.left - size / 2}px`;
    dot.style.top = `${event.clientY - rect.top - size / 2}px`;
    host.appendChild(dot);
    window.setTimeout(() => dot.remove(), 520);
};

export const withRipple =
    (handler, variant = "dark") =>
    (event) => {
        spawnRipple(event, variant);
        if (typeof handler === "function") handler(event);
    };
