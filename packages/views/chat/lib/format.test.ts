import { describe, expect, it } from "vitest";

import { formatElapsedMs, formatElapsedSecs } from "./format";

describe("formatElapsedSecs", () => {
  it("formats values under one minute as seconds", () => {
    expect(formatElapsedSecs(0)).toBe("0s");
    expect(formatElapsedSecs(59)).toBe("59s");
  });

  it("formats whole minutes without a zero-second suffix", () => {
    expect(formatElapsedSecs(60)).toBe("1m");
    expect(formatElapsedSecs(180)).toBe("3m");
  });

  it("formats mixed minute and second values", () => {
    expect(formatElapsedSecs(61)).toBe("1m 1s");
    expect(formatElapsedSecs(125)).toBe("2m 5s");
  });
});

describe("formatElapsedMs", () => {
  it("rounds milliseconds to the nearest second before formatting", () => {
    expect(formatElapsedMs(1_499)).toBe("1s");
    expect(formatElapsedMs(1_500)).toBe("2s");
    expect(formatElapsedMs(60_500)).toBe("1m 1s");
  });

  it("clamps negative millisecond values to zero", () => {
    expect(formatElapsedMs(-500)).toBe("0s");
  });
});
