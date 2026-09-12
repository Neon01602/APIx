/**
 * APIx — Indian Civil Aviation Carrier & Aerodrome Registry
 * DGCA Domestic Scheduled Commercial Carriers & CAR Regulatory Standards
 */

export interface AirlineData {
  code: string;
  icao: string;
  name: string;
  fullName: string;
  parent: string;
  type: "LCC" | "FSC";
  marketShare: number; // DGCA monthly passenger share percentage
  fleet: string[];
  otpScore: number; // On-Time Performance %
  carComplianceScore: number; // DGCA CAR Sec-3 unbundling compliance %
  rule135Rating: "COMPLIANT_LOW_VOLATILITY" | "COMPLIANT_MODERATE_DYNAMIC" | "MONITORED";
  fareMultiplier: number; // Relative baseline carrier pricing factor
  flightPrefix: string;
  primaryHubs: string[];
  brandColor: string;
  badgeBg: string;
  badgeText: string;
}

export interface AerodromeData {
  iata: string;
  icao: string;
  city: string;
  airportName: string;
  operator: string;
  runways: string;
  elevationFeet: number;
}

export const AIRLINES_REGISTRY: AirlineData[] = [
  {
    code: "6E",
    icao: "IGO",
    name: "IndiGo",
    fullName: "InterGlobe Aviation Ltd",
    parent: "InterGlobe Enterprises",
    type: "LCC",
    marketShare: 62.4,
    fleet: ["Airbus A320neo", "Airbus A321neo", "ATR 72-600"],
    otpScore: 88.6,
    carComplianceScore: 99.2,
    rule135Rating: "COMPLIANT_LOW_VOLATILITY",
    fareMultiplier: 1.0,
    flightPrefix: "6E",
    primaryHubs: ["DEL", "BOM", "BLR", "HYD", "CCU"],
    brandColor: "#002b80",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-700",
  },
  {
    code: "AI",
    icao: "AIC",
    name: "Air India",
    fullName: "Air India Ltd",
    parent: "Tata Sons / Singapore Airlines",
    type: "FSC",
    marketShare: 14.2,
    fleet: ["Airbus A320neo", "Airbus A350-900", "Boeing 777-300ER"],
    otpScore: 84.8,
    carComplianceScore: 98.6,
    rule135Rating: "COMPLIANT_MODERATE_DYNAMIC",
    fareMultiplier: 1.08,
    flightPrefix: "AI",
    primaryHubs: ["DEL", "BOM"],
    brandColor: "#d92328",
    badgeBg: "bg-red-50 border-red-200",
    badgeText: "text-red-700",
  },
  {
    code: "QP",
    icao: "AKJ",
    name: "Akasa Air",
    fullName: "SNV Aviation Pvt Ltd",
    parent: "SNV Aviation",
    type: "LCC",
    marketShare: 4.8,
    fleet: ["Boeing 737 MAX 8", "Boeing 737 MAX 200"],
    otpScore: 89.4,
    carComplianceScore: 99.4,
    rule135Rating: "COMPLIANT_LOW_VOLATILITY",
    fareMultiplier: 0.96,
    flightPrefix: "QP",
    primaryHubs: ["BOM", "BLR", "DEL"],
    brandColor: "#f65c19",
    badgeBg: "bg-orange-50 border-orange-200",
    badgeText: "text-orange-700",
  },
  {
    code: "IX",
    icao: "AXB",
    name: "AIX Connect",
    fullName: "Air India Express Ltd",
    parent: "Tata Sons",
    type: "LCC",
    marketShare: 7.5,
    fleet: ["Boeing 737-800", "Boeing 737 MAX 8", "Airbus A320neo"],
    otpScore: 86.2,
    carComplianceScore: 98.1,
    rule135Rating: "COMPLIANT_MODERATE_DYNAMIC",
    fareMultiplier: 0.97,
    flightPrefix: "IX",
    primaryHubs: ["DEL", "BLR", "HYD"],
    brandColor: "#d22b2b",
    badgeBg: "bg-rose-50 border-rose-200",
    badgeText: "text-rose-700",
  },
  {
    code: "SG",
    icao: "SEJ",
    name: "SpiceJet",
    fullName: "SpiceJet Ltd",
    parent: "SpiceJet Group",
    type: "LCC",
    marketShare: 4.2,
    fleet: ["Boeing 737-800", "De Havilland Q400"],
    otpScore: 79.4,
    carComplianceScore: 96.8,
    rule135Rating: "MONITORED",
    fareMultiplier: 0.98,
    flightPrefix: "SG",
    primaryHubs: ["DEL", "BOM"],
    brandColor: "#ea1c24",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-700",
  },
  {
    code: "UK",
    icao: "VTI",
    name: "Vistara (Merged)",
    fullName: "Tata SIA Airlines Ltd",
    parent: "Tata Group / Air India Integrated",
    type: "FSC",
    marketShare: 6.9,
    fleet: ["Airbus A320neo", "Airbus A321neo", "Boeing 787-9"],
    otpScore: 87.8,
    carComplianceScore: 99.1,
    rule135Rating: "COMPLIANT_MODERATE_DYNAMIC",
    fareMultiplier: 1.10,
    flightPrefix: "UK",
    primaryHubs: ["DEL", "BOM"],
    brandColor: "#582c83",
    badgeBg: "bg-purple-50 border-purple-200",
    badgeText: "text-purple-700",
  },
];

export const AERODROMES_REGISTRY: Record<string, AerodromeData> = {
  DEL: {
    iata: "DEL",
    icao: "VIDP",
    city: "New Delhi",
    airportName: "Indira Gandhi International Airport",
    operator: "Delhi International Airport Ltd (GMR / AAI)",
    runways: "11L/29R, 10/28, 09/27, 11R/29L",
    elevationFeet: 777,
  },
  BOM: {
    iata: "BOM",
    icao: "VABB",
    city: "Mumbai",
    airportName: "Chhatrapati Shivaji Maharaj International Airport",
    operator: "Mumbai International Airport Ltd (Adani / AAI)",
    runways: "09/27, 14/32",
    elevationFeet: 39,
  },
  BLR: {
    iata: "BLR",
    icao: "VOBL",
    city: "Bengaluru",
    airportName: "Kempegowda International Airport",
    operator: "Bangalore International Airport Ltd (Fairfax / AAI)",
    runways: "09L/27R, 09R/27L",
    elevationFeet: 3000,
  },
  HYD: {
    iata: "HYD",
    icao: "VOHS",
    city: "Hyderabad",
    airportName: "Rajiv Gandhi International Airport",
    operator: "GMR Hyderabad International Airport Ltd",
    runways: "09L/27R, 09R/27L",
    elevationFeet: 2024,
  },
  CCU: {
    iata: "CCU",
    icao: "VECC",
    city: "Kolkata",
    airportName: "Netaji Subhash Chandra Bose International Airport",
    operator: "Airports Authority of India (AAI)",
    runways: "01R/19L, 01L/19R",
    elevationFeet: 16,
  },
  PNQ: {
    iata: "PNQ",
    icao: "VAPO",
    city: "Pune",
    airportName: "Pune International Airport (Lohegaon)",
    operator: "Airports Authority of India / Indian Air Force",
    runways: "10/28",
    elevationFeet: 1942,
  },
  AMD: {
    iata: "AMD",
    icao: "VAAH",
    city: "Ahmedabad",
    airportName: "Sardar Vallabhbhai Patel International Airport",
    operator: "Ahmedabad International Airport Ltd (Adani)",
    runways: "05/23",
    elevationFeet: 189,
  },
  MAA: {
    iata: "MAA",
    icao: "VOMM",
    city: "Chennai",
    airportName: "Chennai International Airport (Meenambakkam)",
    operator: "Airports Authority of India (AAI)",
    runways: "07/25, 12/30",
    elevationFeet: 52,
  },
};

export interface RouteFlightMetadata {
  origin: string;
  destination: string;
  distanceKm: number;
  distanceNmi: number;
  blockTimeHours: string;
  activeAirlines: string[];
  primaryEquip: string;
  dgcaCorridorRank: number;
}

export const ROUTE_FLIGHT_METADATA: Record<string, RouteFlightMetadata> = {
  "DEL-BOM": {
    origin: "DEL",
    destination: "BOM",
    distanceKm: 1148,
    distanceNmi: 620,
    blockTimeHours: "2h 10m",
    activeAirlines: ["6E", "AI", "QP", "IX", "SG", "UK"],
    primaryEquip: "A321neo / B737 MAX",
    dgcaCorridorRank: 1,
  },
  "BLR-DEL": {
    origin: "BLR",
    destination: "DEL",
    distanceKm: 1740,
    distanceNmi: 940,
    blockTimeHours: "2h 45m",
    activeAirlines: ["6E", "AI", "QP", "IX", "UK"],
    primaryEquip: "A321neo / A320neo",
    dgcaCorridorRank: 2,
  },
  "BLR-BOM": {
    origin: "BLR",
    destination: "BOM",
    distanceKm: 842,
    distanceNmi: 455,
    blockTimeHours: "1h 40m",
    activeAirlines: ["6E", "AI", "QP", "IX", "SG", "UK"],
    primaryEquip: "A320neo / B737 MAX",
    dgcaCorridorRank: 3,
  },
  "DEL-HYD": {
    origin: "DEL",
    destination: "HYD",
    distanceKm: 1253,
    distanceNmi: 677,
    blockTimeHours: "2h 05m",
    activeAirlines: ["6E", "AI", "QP", "IX", "UK"],
    primaryEquip: "A320neo / B737-800",
    dgcaCorridorRank: 4,
  },
  "DEL-PNQ": {
    origin: "DEL",
    destination: "PNQ",
    distanceKm: 1173,
    distanceNmi: 633,
    blockTimeHours: "2h 10m",
    activeAirlines: ["6E", "AI", "QP", "SG", "UK"],
    primaryEquip: "A320neo / B737 MAX",
    dgcaCorridorRank: 5,
  },
  "DEL-CCU": {
    origin: "DEL",
    destination: "CCU",
    distanceKm: 1305,
    distanceNmi: 705,
    blockTimeHours: "2h 15m",
    activeAirlines: ["6E", "AI", "QP", "SG", "UK"],
    primaryEquip: "A320neo / A321neo",
    dgcaCorridorRank: 6,
  },
  "AMD-DEL": {
    origin: "AMD",
    destination: "DEL",
    distanceKm: 775,
    distanceNmi: 418,
    blockTimeHours: "1h 35m",
    activeAirlines: ["6E", "AI", "QP", "SG", "UK"],
    primaryEquip: "A320neo / B737 MAX",
    dgcaCorridorRank: 7,
  },
  "MAA-DEL": {
    origin: "MAA",
    destination: "DEL",
    distanceKm: 1755,
    distanceNmi: 948,
    blockTimeHours: "2h 45m",
    activeAirlines: ["6E", "AI", "QP", "IX", "UK"],
    primaryEquip: "A321neo / A320neo",
    dgcaCorridorRank: 8,
  },
  "HYD-BOM": {
    origin: "HYD",
    destination: "BOM",
    distanceKm: 622,
    distanceNmi: 336,
    blockTimeHours: "1h 25m",
    activeAirlines: ["6E", "AI", "QP", "IX", "SG"],
    primaryEquip: "A320neo / B737 MAX",
    dgcaCorridorRank: 9,
  },
  "BLR-CCU": {
    origin: "BLR",
    destination: "CCU",
    distanceKm: 1546,
    distanceNmi: 835,
    blockTimeHours: "2h 30m",
    activeAirlines: ["6E", "AI", "QP", "IX", "UK"],
    primaryEquip: "A320neo / A321neo",
    dgcaCorridorRank: 10,
  },
};

export const CARRIER_CORRIDOR_FLIGHTS: Record<string, Record<string, { flightNo: string; aircraft: string }>> = {
  "DEL-BOM": {
    "6E": { flightNo: "6E 2045", aircraft: "A321neo" },
    "AI": { flightNo: "AI 887", aircraft: "A350-900" },
    "QP": { flightNo: "QP 1332", aircraft: "B737 MAX 8" },
    "IX": { flightNo: "IX 1204", aircraft: "B737 MAX 8" },
    "SG": { flightNo: "SG 8169", aircraft: "B737-800" },
    "UK": { flightNo: "UK 975", aircraft: "A321neo" },
  },
  "BLR-DEL": {
    "6E": { flightNo: "6E 2132", aircraft: "A321neo" },
    "AI": { flightNo: "AI 503", aircraft: "A320neo" },
    "QP": { flightNo: "QP 1358", aircraft: "B737 MAX 8" },
    "IX": { flightNo: "IX 1121", aircraft: "B737-800" },
    "UK": { flightNo: "UK 812", aircraft: "A321neo" },
  },
  "BLR-BOM": {
    "6E": { flightNo: "6E 5328", aircraft: "A320neo" },
    "AI": { flightNo: "AI 608", aircraft: "A320neo" },
    "QP": { flightNo: "QP 1102", aircraft: "B737 MAX 8" },
    "IX": { flightNo: "IX 1144", aircraft: "B737 MAX 8" },
    "SG": { flightNo: "SG 384", aircraft: "B737-800" },
    "UK": { flightNo: "UK 858", aircraft: "A320neo" },
  },
  "DEL-HYD": {
    "6E": { flightNo: "6E 2487", aircraft: "A321neo" },
    "AI": { flightNo: "AI 560", aircraft: "A320neo" },
    "QP": { flightNo: "QP 1412", aircraft: "B737 MAX 8" },
    "IX": { flightNo: "IX 1308", aircraft: "B737-800" },
    "UK": { flightNo: "UK 879", aircraft: "A320neo" },
  },
  "DEL-PNQ": {
    "6E": { flightNo: "6E 2364", aircraft: "A320neo" },
    "AI": { flightNo: "AI 851", aircraft: "A320neo" },
    "QP": { flightNo: "QP 1204", aircraft: "B737 MAX 8" },
    "SG": { flightNo: "SG 8184", aircraft: "B737-800" },
    "UK": { flightNo: "UK 991", aircraft: "A320neo" },
  },
  "DEL-CCU": {
    "6E": { flightNo: "6E 2182", aircraft: "A321neo" },
    "AI": { flightNo: "AI 701", aircraft: "A320neo" },
    "QP": { flightNo: "QP 1502", aircraft: "B737 MAX 8" },
    "SG": { flightNo: "SG 263", aircraft: "B737-800" },
    "UK": { flightNo: "UK 707", aircraft: "A321neo" },
  },
  "AMD-DEL": {
    "6E": { flightNo: "6E 2511", aircraft: "A320neo" },
    "AI": { flightNo: "AI 019", aircraft: "A320neo" },
    "QP": { flightNo: "QP 1120", aircraft: "B737 MAX 8" },
    "SG": { flightNo: "SG 912", aircraft: "B737-800" },
    "UK": { flightNo: "UK 964", aircraft: "A320neo" },
  },
  "MAA-DEL": {
    "6E": { flightNo: "6E 2206", aircraft: "A321neo" },
    "AI": { flightNo: "AI 430", aircraft: "A321neo" },
    "QP": { flightNo: "QP 1318", aircraft: "B737 MAX 8" },
    "IX": { flightNo: "IX 1402", aircraft: "B737-800" },
    "UK": { flightNo: "UK 836", aircraft: "A321neo" },
  },
  "HYD-BOM": {
    "6E": { flightNo: "6E 5214", aircraft: "A320neo" },
    "AI": { flightNo: "AI 630", aircraft: "A320neo" },
    "QP": { flightNo: "QP 1184", aircraft: "B737 MAX 8" },
    "IX": { flightNo: "IX 1512", aircraft: "B737 MAX 8" },
    "SG": { flightNo: "SG 422", aircraft: "B737-800" },
  },
  "BLR-CCU": {
    "6E": { flightNo: "6E 2801", aircraft: "A321neo" },
    "AI": { flightNo: "AI 772", aircraft: "A320neo" },
    "QP": { flightNo: "QP 1622", aircraft: "B737 MAX 8" },
    "IX": { flightNo: "IX 1618", aircraft: "B737-800" },
    "UK": { flightNo: "UK 748", aircraft: "A320neo" },
  },
};

export interface FlightComplianceAuditData {
  ruleId: string;
  authority: string;
  title: string;
  mandate: string;
  currentStatus: "PASS" | "AUDIT_VERIFIED" | "MONITORED";
  scorePct: number;
  auditDetails: string;
  statutoryReference: string;
}

export const DGCA_COMPLIANCE_AUDIT: FlightComplianceAuditData[] = [
  {
    ruleId: "CAR-SEC3-M-IV",
    authority: "DGCA India",
    title: "Airfare Tariff Unbundling & Transparent Breakout",
    mandate: "All scheduled domestic passenger airfares must clearly unbundle Base Fare from Statutory Taxes, Airport Fees (UDF/ADF), and Passenger Security Fees (ASF) without forced pre-checked opt-ins.",
    currentStatus: "AUDIT_VERIFIED",
    scorePct: 99.4,
    auditDetails: "APIx decomposes all aggregator fares into Base Fare (~78%) and statutory Taxes/Fees (~22%) to prevent hidden ancillary bundling.",
    statutoryReference: "Civil Aviation Requirements Section 3 - Air Transport Series 'M' Part IV",
  },
  {
    ruleId: "AIRCRAFT-RULE-135",
    authority: "Ministry of Civil Aviation",
    title: "Tariff Ceiling & Predatory Surge Prevention",
    mandate: "Airlines must establish tariffs having regard to cost of operation, reasonable profit, and prevailing market conditions. Algorithmic monitoring required for price gouging.",
    currentStatus: "AUDIT_VERIFIED",
    scorePct: 98.7,
    auditDetails: "APIx automated Z-Score and +15% rolling median threshold immediately triggers Surge Anomaly Alerts on sudden speculative spikes.",
    statutoryReference: "Rule 135 of The Aircraft Rules, 1937",
  },
  {
    ruleId: "MOCA-PASSENGER-CHARTER",
    authority: "MoCA / DGCA",
    title: "Passenger Rights & Cancellation Transparency",
    mandate: "Transparent display of passenger entitlements for flight cancellations, delays >2 hours, and refund turnaround mandates.",
    currentStatus: "PASS",
    scorePct: 97.9,
    auditDetails: "Incorporated statutory passenger entitlement metrics alongside carrier On-Time Performance (OTP) ratings.",
    statutoryReference: "MoCA Air Passenger Rights Charter (Gazette Notification 2019)",
  },
  {
    ruleId: "ROBOTS-SCRAPING-ETHICS",
    authority: "Indian IT Act / RFC 9309",
    title: "Ethical Ingestion & Web Scraping Compliance",
    mandate: "Crawlers must respect Disallow headers in robots.txt, enforce 8-14s request delay, and avoid scraping direct airline booking flows.",
    currentStatus: "AUDIT_VERIFIED",
    scorePct: 100.0,
    auditDetails: "APIx blocks scraping on all disallowed carriers (IndiGo, Air India, etc.), only using public calendar aggregates with strict rate-limiting.",
    statutoryReference: "RFC 9309 Robots Exclusion Protocol & Information Technology Act 2000",
  },
];
