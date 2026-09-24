import { test } from "node:test";
import assert from "node:assert/strict";
import { cardSchema, emptyCard } from "../shared/schema";
import { formatPhone } from "../shared/phone";

test("website accepts domains without a scheme and rejects unsafe or malformed addresses", () => {
  const input = { ...emptyCard, firstName: "Test", lastName: "Kart" };
  for (const [website, expected] of [
    ["www.metekgrup.com", "https://www.metekgrup.com/"],
    [" metekgrup.com/iletisim?a=1#ekip ", "https://metekgrup.com/iletisim?a=1#ekip"],
    ["https://www.metekgrup.com", "https://www.metekgrup.com/"],
    ["http://example.test:8080/", "http://example.test:8080/"],
    ["", ""],
  ]) assert.equal(cardSchema.parse({ ...input, website }).website, expected);
  for (const website of ["javascript:alert(1)", "data:text/html,test", "ftp://example.test", "https://", "https://user:password@example.test", "www.company .com", "not-a-site", "//example.test", "example.test\\path"])
    assert.equal(cardSchema.safeParse({ ...input, website }).success, false, website);
});

test("phone formatting preserves entered digits, international numbers and invalid input for validation", () => {
  for (const [source, expected] of [
    ["05321234567", "0532 123 45 67"], ["02121234567", "0212 123 45 67"],
    ["+905321234567", "+90 532 123 45 67"], ["5321234567", "532 123 45 67"],
    ["+44 20 7946 0958", "+44 20 7946 0958"], ["053", "053"],
    ["abc1234567", "abc1234567"], ["", ""],
  ]) {
    assert.equal(formatPhone(source), expected);
    assert.equal(formatPhone(source).replace(/\D/g, ""), source.replace(/\D/g, ""));
  }
});
