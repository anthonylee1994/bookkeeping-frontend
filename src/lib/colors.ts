/** Flat UI Colors 的 "defo" palette（https://flatuicolors.com/palette/defo）。 */
export const FLAT_UI_COLORS = [
    "#1abc9c",
    "#16a085",
    "#2ecc71",
    "#27ae60",
    "#3498db",
    "#2980b9",
    "#9b59b6",
    "#8e44ad",
    "#34495e",
    "#2c3e50",
    "#f1c40f",
    "#f39c12",
    "#e67e22",
    "#d35400",
    "#e74c3c",
    "#c0392b",
    "#ecf0f1",
    "#bdc3c7",
    "#95a5a6",
    "#7f8c8d",
];

/** 依相對亮度判斷淺色，用來為色塊上的內容（tick／圖示）選對比色。 */
export function isLightColor(hex: string): boolean {
    const value = hex.replace("#", "");
    const red = parseInt(value.slice(0, 2), 16);
    const green = parseInt(value.slice(2, 4), 16);
    const blue = parseInt(value.slice(4, 6), 16);
    return (0.299 * red + 0.587 * green + 0.114 * blue) / 255 > 0.6;
}
