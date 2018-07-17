import formatters from "../valueFormatters";

describe("valueFormatters tests", () => {
  test("formatInt", done => {
    expect(formatters.formatInt(5)).toBe("5");
    expect(formatters.formatInt(null)).toBe("-");
    expect(formatters.formatInt("d")).toBe("d");
    done();
  });
  test("formatFloat", done => {
    expect(formatters.formatFloat(5)).toBe("5");
    expect(formatters.formatFloat(5.1234)).toBe("5.12");
    expect(formatters.formatFloat(5.1234, 4)).toBe("5.1234");
    expect(formatters.formatFloat(null)).toBe("-");
    expect(formatters.formatFloat("d")).toBe("d");
    done();
  });
  test("formatByFactor", done => {
    expect(formatters.formatByFactor(50, 10)).toBe("5");
    expect(formatters.formatByFactor(null)).toBe("-");
    expect(formatters.formatByFactor("d")).toBe("d");
    done();
  });
  test("formatByPercent", done => {
    expect(formatters.formatByPercent(0.05)).toBe("5");
    expect(formatters.formatByPercent("N/A")).toBe("N/A");
    done();
  });
  test("formatPercent", done => {
    expect(formatters.formatPercent()(0.05)).toBe("5%");
    expect(formatters.formatPercent()("N/A")).toBe("N/A");
    done();
  });
});
