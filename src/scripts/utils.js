export function formatFromThousands(value) {
    const num = Number(value);

    if (isNaN(num)) return "";

    return Math.floor(num / 1000).toString();
}
