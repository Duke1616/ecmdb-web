const DEMO_HOSTNAMES = new Set(["82.156.165.98", "www.fleetops.top", "fleetops.top"])

export const isDemoHost = (hostname = window.location.hostname) => DEMO_HOSTNAMES.has(hostname)
