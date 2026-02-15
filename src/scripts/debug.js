export const debugLog = (...args) => {
    return;
    const pre =
        document.getElementById("debug") ||
        (() => {
            const el = document.createElement("pre");
            el.id = "debug";
            el.style.position = "fixed";
            el.style.bottom = "0";
            el.style.left = "0";
            el.style.right = "0";
            el.style.maxHeight = "40vh";
            el.style.overflow = "auto";
            el.style.background = "black";
            el.style.color = "lime";
            el.style.fontSize = "12px";
            el.style.zIndex = "9999";
            document.body.appendChild(el);
            return el;
        })();

    pre.textContent += "\n" + args.map((a) => JSON.stringify(a)).join(" ");
}