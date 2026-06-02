export type Direction = "higher_is_better" | "lower_is_better";
export type MissingStrategy = "renormalize_available_weights";
export type GeoLevel = "state" | "municipality";

export interface VariableConfig {
  column: string;
  label: string;
  enabled: boolean;
  direction: Direction;
  weight: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  validCount: number;
  missingCount: number;
  warnings: string[];
}

export interface SourceRow {
  [k: string]: unknown;
}

export interface IndexVariableValue {
  raw: number | null;
  normalized: number | null;
  weight: number;
}

export interface IndexDataRow {
  ibge_code: string;
  ibge_name: string;
  value: number | null;
  variables: Record<string, IndexVariableValue>;
  class_index?: number | null;
  class_label?: string | null;
}

export type IndexData = IndexDataRow[];

const NUM_THRESHOLD = 0.7; // share of numeric values needed for a column to be a "numeric variable"

function toNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function normalizeIbgeCode(v: unknown, level: GeoLevel): string {
  if (v == null) return "";
  let s = String(v).trim().replace(/\s+/g, "").toUpperCase();
  // strip trailing ".0" from spreadsheet number coercion
  if (/^\d+\.0+$/.test(s)) s = s.split(".")[0];
  if (level === "state") {
    if (/^\d+$/.test(s)) return s.padStart(2, "0").slice(0, 2);
    return s.slice(0, 2);
  }
  // municipality: 7 digits expected
  if (/^\d+$/.test(s)) return s.padStart(7, "0").slice(0, 7);
  return s;
}

/** Detect numeric columns and compute stats. */
export function detectVariables(
  rows: SourceRow[],
  excludeColumns: string[]
): VariableConfig[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]).filter((h) => !excludeColumns.includes(h));
  const variables: VariableConfig[] = [];
  for (const col of headers) {
    const nums: number[] = [];
    let missing = 0;
    for (const r of rows) {
      const n = toNumber(r[col]);
      if (n === null) missing++;
      else nums.push(n);
    }
    if (nums.length === 0) continue;
    if (nums.length / rows.length < NUM_THRESHOLD) continue;
    nums.sort((a, b) => a - b);
    const min = nums[0];
    const max = nums[nums.length - 1];
    const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
    const median = nums[Math.floor(nums.length / 2)];
    const warnings: string[] = [];
    if (min === max) warnings.push("Variável constante (min = max).");
    if (missing > 0) warnings.push(`${missing} valores ausentes.`);
    variables.push({
      column: col,
      label: col,
      enabled: true,
      direction: "higher_is_better",
      weight: 0,
      min,
      max,
      mean,
      median,
      validCount: nums.length,
      missingCount: missing,
      warnings,
    });
  }
  return variables;
}

export function equalWeights(vars: VariableConfig[]): VariableConfig[] {
  const active = vars.filter((v) => v.enabled);
  const w = active.length > 0 ? 1 / active.length : 0;
  return vars.map((v) => ({ ...v, weight: v.enabled ? w : 0 }));
}

export function normalizeWeights(vars: VariableConfig[]): VariableConfig[] {
  const sum = vars.filter((v) => v.enabled).reduce((s, v) => s + Math.max(0, v.weight), 0);
  if (sum === 0) return equalWeights(vars);
  return vars.map((v) =>
    v.enabled ? { ...v, weight: Math.max(0, v.weight) / sum } : { ...v, weight: 0 }
  );
}

export function activeWeightSum(vars: VariableConfig[]): number {
  return vars.filter((v) => v.enabled).reduce((s, v) => s + (v.weight || 0), 0);
}

export function weightsValid(vars: VariableConfig[], tol = 0.001): boolean {
  const active = vars.filter((v) => v.enabled);
  if (active.length === 0) return false;
  if (active.some((v) => v.weight < 0)) return false;
  return Math.abs(activeWeightSum(vars) - 1) <= tol;
}

interface CalcInput {
  rows: SourceRow[];
  codeColumn: string;
  nameColumn: string | null;
  level: GeoLevel;
  variables: VariableConfig[];
  missingStrategy?: MissingStrategy;
}

export interface CalcResult {
  data: IndexData;
  duplicates: string[];
  totalLocalities: number;
  withValue: number;
  withoutValue: number;
}

export function calculateIndex(input: CalcInput): CalcResult {
  const { rows, codeColumn, nameColumn, level, variables } = input;
  const active = variables.filter((v) => v.enabled);
  const codeMap = new Map<string, IndexDataRow>();
  const dupSet = new Set<string>();

  for (const r of rows) {
    const code = normalizeIbgeCode(r[codeColumn], level);
    if (!code) continue;
    const name = nameColumn ? String(r[nameColumn] ?? "").trim() : "";
    if (codeMap.has(code)) {
      dupSet.add(code);
      continue;
    }

    const varValues: Record<string, IndexVariableValue> = {};
    let weightedSum = 0;
    let availableWeight = 0;
    let anyValid = false;

    for (const v of active) {
      const raw = toNumber(r[v.column]);
      let normalized: number | null = null;
      if (raw !== null) {
        if (v.max === v.min) {
          normalized = 0.5;
        } else if (v.direction === "higher_is_better") {
          normalized = (raw - v.min) / (v.max - v.min);
        } else {
          normalized = (v.max - raw) / (v.max - v.min);
        }
        normalized = Math.max(0, Math.min(1, normalized));
        anyValid = true;
        weightedSum += normalized * v.weight;
        availableWeight += v.weight;
      }
      varValues[v.column] = { raw, normalized, weight: v.weight };
    }

    let value: number | null = null;
    if (anyValid && availableWeight > 0) {
      // renormalize_available_weights
      value = weightedSum / availableWeight;
    }

    codeMap.set(code, {
      ibge_code: code,
      ibge_name: name || code,
      value,
      variables: varValues,
    });
  }

  const data = Array.from(codeMap.values());
  const withValue = data.filter((d) => d.value != null).length;
  return {
    data,
    duplicates: Array.from(dupSet),
    totalLocalities: data.length,
    withValue,
    withoutValue: data.length - withValue,
  };
}

export interface IndexStats {
  min: number;
  max: number;
  mean: number;
  median: number;
}

export function computeStats(values: number[]): IndexStats | null {
  const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const sum = clean.reduce((s, n) => s + n, 0);
  return {
    min: clean[0],
    max: clean[clean.length - 1],
    mean: sum / clean.length,
    median: clean[Math.floor(clean.length / 2)],
  };
}

export const IBGE_GEOJSON = {
  state:
    "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&qualidade=minima&formato=application%2Fvnd.geo%2Bjson",
  municipality:
    "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=municipio&qualidade=minima&formato=application%2Fvnd.geo%2Bjson",
};