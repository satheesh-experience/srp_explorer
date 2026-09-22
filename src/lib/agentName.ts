// Deterministic display name for a sample agent -- mirrors the original
// Python backend's _generate_agent_name(): stable across reloads, never a
// real person, since the underlying data only has a numeric agent_id.
const FIRST_NAMES = [
  "Jordan", "Avery", "Morgan", "Riley", "Casey", "Taylor", "Reese", "Rowan",
  "Sydney", "Hayden", "Quinn", "Elliot", "Dakota", "Skyler", "Cameron", "Emerson",
];
const LAST_NAMES = [
  "Bennett", "Sawyer", "Coleman", "Whitfield", "Marsh", "Reyes", "Delgado", "Hart",
  "Osei", "Novak", "Larkin", "Vance", "Pemberton", "Nakamura", "Ellison", "Brandt",
];

export function generateAgentName(agentId: number, verticalName?: string | null): string {
  const first = FIRST_NAMES[agentId % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(agentId / FIRST_NAMES.length) % LAST_NAMES.length];
  const suffix = verticalName ? ` - ${verticalName}` : "";
  return `${first} ${last}${suffix}`;
}
