import formatters from "../valueFormatters";
import { test } from "./test-utils";

test("valueFormatters: formatInt", t => {
  t.equals(formatters.formatInt(5), "5", "should return 5");
  t.equals(formatters.formatInt(null), "-", "should return -");
  t.equals(formatters.formatInt("d"), "d", "should return d");
  t.end();
});

test("valueFormatters: formatFloat", t => {
  t.equals(formatters.formatFloat(5), "5", "should return 5");
  t.equals(formatters.formatFloat(5.1234), "5.12", "should return 5.12");
  t.equals(formatters.formatFloat(5.1234, 4), "5.1234", "should return 5.1234");
  t.equals(formatters.formatFloat(null), "-", "should return -");
  t.equals(formatters.formatFloat("d"), "d", "should return d");
  t.end();
});

test("valueFormatters: formatByFactor", t => {
  t.equals(formatters.formatByFactor(50, 10), "5", "should return 5");
  t.equals(formatters.formatByFactor(null), "-", "should return -");
  t.equals(formatters.formatByFactor("d"), "d", "should return d");
  t.end();
});

test("valueFormatters: formatByPercent", t => {
  t.equals(formatters.formatByPercent(0.05), "5", "should return 5");
  t.equals(formatters.formatByPercent("N/A"), "N/A", "should return N/A");
  t.end();
});

test("valueFormatters: formatPercent", t => {
  t.equals(formatters.formatPercent()(0.05), "5%", "should return 5%");
  t.equals(formatters.formatPercent()("N/A"), "N/A", "should return N/A");
  t.end();
});
