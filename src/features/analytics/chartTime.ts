import type { ChartRange } from "./portfolioHistory";

/**
 * How times are written on the portfolio charts, per range: shared by the
 * Analytics chart and the dashboard's performance card, so they read alike.
 */

/** In the reading (tooltip / bubble): "2:00 pm" · "1 Oct, 2:00 pm" · "1 Oct 2026". */
export function tooltipTime(range: ChartRange) {
  return (time: number) => {
    const date = new Date(time);
    const clock = date.toLocaleTimeString("en-GH", {
      hour: "numeric",
      minute: "2-digit",
    });
    if (range.kind === "day") return clock;
    const day = date.toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      ...(range.kind === "years" || range.kind === "all" ? { year: "numeric" } : {}),
    });
    return range.kind === "week" || range.kind === "month" ? `${day}, ${clock}` : day;
  };
}

/** Under the chart: "2 pm" · "1 Oct" · "Oct 2026". */
export function axisTime(range: ChartRange) {
  return (time: number) => {
    const date = new Date(time);
    if (range.kind === "day")
      return date.toLocaleTimeString("en-GH", { hour: "numeric" });
    if (range.kind === "week" || range.kind === "month") {
      return date.toLocaleDateString("en-GH", {
        day: "numeric",
        month: "short",
      });
    }
    return date.toLocaleDateString("en-GH", {
      month: "short",
      year: "numeric",
    });
  };
}
