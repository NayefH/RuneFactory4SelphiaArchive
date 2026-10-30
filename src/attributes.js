import { t, locale } from "./i18n.js";
import { localizeText } from "./data-localization.js";

export const contextLabels = {
  get base() {
    return t("Ausrüstung · Grundwerte", "Equipment · base stats");
  },
  get upgrade() {
    return t("Upgrade-Bonus", "Upgrade bonus");
  },
  get consume() {
    return t("Beim Verzehr", "When consumed");
  },
  get cook() {
    return t("Als Kochzutat", "As a cooking ingredient");
  },
};
const labels = {
  ATK: ["Angriff", "Attack"],
  DEF: ["Verteidigung", "Defense"],
  "M.ATK": ["Magischer Angriff", "Magic attack"],
  "M.DEF": ["Magische Verteidigung", "Magic defense"],
  STR: ["Stärke", "Strength"],
  VIT: ["Vitalität", "Vitality"],
  INT: ["Intelligenz", "Intelligence"],
  HP: ["LP", "HP"],
  RP: ["RP", "RP"],
  "HP MAX": ["Max. LP", "Max. HP"],
  "RP MAX": ["Max. RP", "Max. RP"],
  CRIT: ["Kritische Treffer", "Critical hits"],
  DIZ: ["Benommenheit", "Dizziness"],
  STUN: ["Betäubung", "Stun"],
  KNOCK: ["Rückstoß", "Knockback"],
  DRAIN: ["Absorption", "Drain"],
};
export const attributeLabel = (key) => {
  const percent = key.endsWith("%"),
    name = percent ? key.slice(0, -1) : key;
  return (
    (labels[name] ? t(...labels[name]) : localizeText(name)) +
    (percent ? " (%)" : "")
  );
};
export const bonus = (record, context, attribute) => {
  const value = record?.attributes?.[context]?.[attribute];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
};
export const formatBonus = (value, key) =>
  value == null
    ? t("Nicht erfasst", "Not recorded")
    : (value > 0 ? "+" : "") +
      value.toLocaleString(locale()) +
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
          .join(
            "",
          )}</div><p class="effect">${escape(localizeText(text))}</p></section>`,
    )
    .join("");
}
