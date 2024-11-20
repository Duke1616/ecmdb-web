import { EventInput } from "@fullcalendar/core"

let eventGuid = 0
const todayStr = new Date().toISOString().replace(/T.*$/, "") // YYYY-MM-DD of today

export const INITIAL_EVENTS: EventInput[] = [
  {
    id: createEventId(),
    title: "All-day event",
    start: todayStr
  },
  {
    id: createEventId(),
    title: "Timed event",
    start: "2024-11-13" + "T22:00:00",
    end: "2024-12-19" + "T22:00:00"
  }
]

export const colorMap = new Map<string, { color: string; class: string }>([
  ["A", { color: "#00B578", class: "green" }],
  ["B", { color: "#FA5151", class: "red" }],
  ["C", { color: "#FF8F1F", class: "orange" }],
  ["D", { color: "#FFC300", class: "yellow" }],
  ["E", { color: "#07B9B9", class: "cyan" }],
  ["F", { color: "#3662EC", class: "blue" }],
  ["G", { color: "#8A38F5", class: "purple" }],
  ["H", { color: "#EB2F96", class: "magenta" }]
])

export function createEventId() {
  return String(eventGuid++)
}
