import chroma from "chroma-js";

export type ClassMethod = "equal_intervals" | "jenks";

export interface ClassifiedScale {
  breaks: number[];
  colors: string[];
  getColor: (v: number | null | undefined) => string;
}

// Simple Jenks natural breaks (port). Fine for hundreds of values.
function jenks(values: number[], nClasses: number): number[] {
  const data = [...values].sort((a, b) => a - b);
  const n = data.length;
  if (n <= nClasses) return [data[0], data[n - 1]];

  const mat1: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(nClasses + 1).fill(0)
  );
  const mat2: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(nClasses + 1).fill(Infinity)
  );
  for (let i = 1; i <= nClasses; i++) {
    mat1[1][i] = 1;
    mat2[1][i] = 0;
    for (let j = 2; j <= n; j++) mat2[j][i] = Infinity;
  }

  for (let l = 2; l <= n; l++) {
    let s1 = 0;
    let s2 = 0;
    let w = 0;
    for (let m = 1; m <= l; m++) {
      const i3 = l - m + 1;
      const val = data[i3 - 1];
      s2 += val * val;
      s1 += val;
      w++;
      const v = s2 - (s1 * s1) / w;
      const i4 = i3 - 1;
      if (i4 !== 0) {
        for (let j = 2; j <= nClasses; j++) {
          if (mat2[l][j] >= v + mat2[i4][j - 1]) {
            mat1[l][j] = i3;
            mat2[l][j] = v + mat2[i4][j - 1];
          }
        }
      }
    }
    mat1[l][1] = 1;
    mat2[l][1] = s2 - (s1 * s1) / w;
  }

  const kclass: number[] = new Array(nClasses + 1).fill(0);
  kclass[nClasses] = data[n - 1];
  kclass[0] = data[0];
  let k = n;
  for (let j = nClasses; j >= 2; j--) {
    const id = mat1[k][j] - 1;
    kclass[j - 1] = data[id];
    k = mat1[k][j] - 1;
  }
  return kclass;
}

function equalIntervals(values: number[], nClasses: number): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / nClasses;
  return Array.from({ length: nClasses + 1 }, (_, i) => min + step * i);
}

export function buildScale(
  values: number[],
  method: ClassMethod,
  nClasses: number,
  scheme: string
): ClassifiedScale {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) {
    return {
      breaks: [],
      colors: [],
      getColor: () => "#e5e7eb",
    };
  }
  const breaks =
    method === "jenks"
      ? jenks(clean, nClasses)
      : equalIntervals(clean, nClasses);

  let colors: string[];
  try {
    colors = chroma.scale(scheme).colors(nClasses);
  } catch {
    colors = chroma.scale("Viridis").colors(nClasses);
  }

  const getColor = (v: number | null | undefined) => {
    if (v == null || !Number.isFinite(v)) return "#e5e7eb";
    for (let i = 1; i < breaks.length; i++) {
      if (v <= breaks[i]) return colors[i - 1];
    }
    return colors[colors.length - 1];
  };

  return { breaks, colors, getColor };
}

export const COLOR_SCHEMES = [
  "Viridis",
  "Magma",
  "Plasma",
  "Inferno",
  "YlOrRd",
  "YlGnBu",
  "RdYlBu",
  "Spectral",
  "Blues",
  "Greens",
  "Reds",
] as const;