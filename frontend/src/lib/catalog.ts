import type { AgeBracket } from "./types";

export const AGE_BRACKETS: AgeBracket[] = [
  "0-4",
  "5-14",
  "15-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
];

export const OCCUPATIONS = [
  "Teacher",
  "Construction",
  "Farmer",
  "Trader",
  "Student",
  "Nurse",
  "Driver",
  "Homemaker",
  "Civil servant",
  "Pastoralist",
];

export const ICD: { code: string; name: string; weight: number }[] = [
  { code: "B50.9", name: "Malaria, unspecified", weight: 5 },
  { code: "J11.1", name: "Influenza", weight: 3 },
  { code: "A09", name: "Infectious gastroenteritis", weight: 3 },
  { code: "J06.9", name: "Acute upper respiratory infection", weight: 3 },
  { code: "E11.9", name: "Type 2 diabetes mellitus", weight: 2.2 },
  { code: "I10", name: "Essential hypertension", weight: 2.2 },
  { code: "J18.9", name: "Pneumonia, unspecified", weight: 1.5 },
  { code: "A01.0", name: "Typhoid fever", weight: 1.3 },
  { code: "A90", name: "Dengue fever", weight: 1 },
  { code: "A15.0", name: "Respiratory tuberculosis", weight: 0.7 },
  { code: "A00.9", name: "Cholera, unspecified", weight: 0.45 },
];

export type GeoCity = { name: string; districts: string[] };

export const GEO: { region: string; cities: GeoCity[] }[] = [
  {
    region: "Khartoum",
    cities: [
      { name: "Khartoum", districts: ["Khartoum North", "Al Amarat", "Burri"] },
      { name: "Omdurman", districts: ["Al Morada", "Umbada"] },
    ],
  },
  {
    region: "Red Sea",
    cities: [{ name: "Port Sudan", districts: ["Downtown", "Salalab"] }],
  },
  {
    region: "Kassala",
    cities: [{ name: "Kassala", districts: ["Al Gash", "Khatmiya"] }],
  },
  {
    region: "Gezira",
    cities: [{ name: "Wad Madani", districts: ["Central", "Al Hasaheisa"] }],
  },
  {
    region: "South Darfur",
    cities: [{ name: "Nyala", districts: ["Al Wadi", "Texas"] }],
  },
];

export type FacilitySeed = {
  code: string;
  name: string;
  city: string;
  region: string;
};

export const FACILITIES: FacilitySeed[] = [
  { code: "TAH-KRT-01", name: "Taha Clinic Khartoum", city: "Khartoum", region: "Khartoum" },
  { code: "TAH-OMD-02", name: "Taha Hospital Omdurman", city: "Omdurman", region: "Khartoum" },
  { code: "TAH-PSD-03", name: "Port Sudan Medical Centre", city: "Port Sudan", region: "Red Sea" },
  { code: "TAH-KSL-04", name: "Kassala General Clinic", city: "Kassala", region: "Kassala" },
  { code: "TAH-WMD-05", name: "Wad Madani Clinic", city: "Wad Madani", region: "Gezira" },
  { code: "TAH-NYL-06", name: "Nyala District Hospital", city: "Nyala", region: "South Darfur" },
];

export const WHITELIST = [
  "event_id",
  "facility_code",
  "diagnosis_code",
  "diagnosis_name",
  "age_bracket",
  "occupation",
  "city",
  "district",
  "region",
  "diagnosed_at",
] as const;

/** Exclusive end of 25 Nov 2026 in Africa/Khartoum. All demo windows hang off this. */
export const DEMO_END_MS = Date.parse("2026-11-26T00:00:00+02:00");
export const DEMO_DAY = "2026-11-25";
export const TZ = "Africa/Khartoum";

export function facilityByCode(code: string) {
  return FACILITIES.find((f) => f.code === code);
}
