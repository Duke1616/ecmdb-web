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

export function createEventId() {
  return String(eventGuid++)
}
