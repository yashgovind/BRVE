import assert from "node:assert/strict";
import test from "node:test";
import { isValidEmailAddress, normalizePhoneNumber } from "../src/lib/auth-validation";

test("email validation accepts standard addresses and rejects malformed input", () => {
  for (const value of ["hello@example.com", "first.last+tag@studio.co", "  PERSON@EXAMPLE.ORG  "]) {
    assert.equal(isValidEmailAddress(value), true, value);
  }
  for (const value of ["", "name", "name@", "@example.com", "name@localhost", "name..last@example.com", "name @example.com", "name@example.123"]) {
    assert.equal(isValidEmailAddress(value), false, value);
  }
});

test("phone validation normalizes common formatting and enforces E.164 digits", () => {
  assert.equal(normalizePhoneNumber("+1 (415) 555-2671"), "+14155552671");
  assert.equal(normalizePhoneNumber("+44 20 7946 0958"), "+442079460958");
  for (const value of ["4155552671", "+0123456789", "+1234567", "+1234567890123456", "+1 415 CALL NOW"]) {
    assert.equal(normalizePhoneNumber(value), null, value);
  }
});
