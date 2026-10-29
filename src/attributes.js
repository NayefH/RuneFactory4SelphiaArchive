export const contextLabels = {
  base: "Ausrüstung · Grundwerte",
  upgrade: "Upgrade-Bonus",
  consume: "Beim Verzehr",
  cook: "Als Kochzutat",
};
const labels = {
  ATK: "Angriff",
  DEF: "Verteidigung",
  "M.ATK": "Magischer Angriff",
  "M.DEF": "Magische Verteidigung",
  STR: "Stärke",
  VIT: "Vitalität",
  INT: "Intelligenz",
  HP: "LP",
  RP: "RP",
  "HP MAX": "Max. LP",
  "RP MAX": "Max. RP",
  CRIT: "Kritische Treffer",
  DIZ: "Benommenheit",
  STUN: "Betäubung",
  KNOCK: "Rückstoß",
  DRAIN: "Absorption",
};
export const attributeLabel = (key) => {
  const percent = key.endsWith("%"),
    name = percent ? key.slice(0, -1) : key;
  return (labels[name] || name) + (percent ? " (%)" : "");
};
export const bonus = (record, context, attribute) => {
  const value = record?.attributes?.[context]?.[attribute];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
};
export const formatBonus = (value, key) =>
  value == null
    ? "Nicht erfasst"
    : (value > 0 ? "+" : "") +
      value.toLocaleString("de-DE") +
      (key.endsWith("%") ? " %" : "");
export function attributePanel(record, escape) {
  if (!record.attributes) return "";
  return Object.entries(record.attributeText || {})
    .map(
      ([context, text]) =>
        `<section class="attribute-section"><h3>${contextLabels[context] || escape(context)}</h3><div class="attribute-grid">${Object.entries(
          record.attributes[context] || {},
        )
          .map(
            ([key, value]) =>
              `<div><span>${escape(attributeLabel(key))}</span><strong>${escape(formatBonus(value, key))}</strong><small>${escape(key)}</small></div>`,
          )
          .join("")}</div><p class="effect">${escape(text)}</p></section>`,
    )
    .join("");
}
