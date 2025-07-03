export const normalizeTime = (time) => {
  const [raw, meridian] = time.split(/(am|pm)/i);
  const [h, m] = raw.trim().split(":");
  return `${h.padStart(2, "0")}:${m}${meridian.toLowerCase()}`;
};
