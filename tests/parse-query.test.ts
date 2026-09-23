import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSearchQuery } from "../src/lib/search/parse-query";

test("make + model text", () => {
  const r = parseSearchQuery("BMW M3");
  assert.deepEqual(r.make, ["BMW"]);
  assert.deepEqual(r.terms, ["m3"]);
});

test("price ceiling", () => {
  const r = parseSearchQuery("Porsche under $100,000");
  assert.deepEqual(r.make, ["Porsche"]);
  assert.equal(r.maxPrice, 100_000);
});

test("year floor + body type", () => {
  const r = parseSearchQuery("2020+ Toyota SUV");
  assert.equal(r.minYear, 2020);
  assert.deepEqual(r.make, ["Toyota"]);
  assert.deepEqual(r.bodyType, ["SUV"]);
});

test("location", () => {
  const r = parseSearchQuery("Ford Mustang in Miami");
  assert.equal(r.city, "Miami");
  assert.deepEqual(r.make, ["Ford"]);
  assert.deepEqual(r.terms, ["mustang"]);
});

test("aliases, mileage, condition", () => {
  const r = parseSearchQuery("used chevy truck under 30k miles");
  assert.deepEqual(r.make, ["Chevrolet"]);
  assert.equal(r.maxMileage, 30_000);
  assert.deepEqual(r.condition, ["USED"]);
  assert.deepEqual(r.bodyType, ["PICKUP"]);
});

test("price range with k suffix and transmission", () => {
  const r = parseSearchQuery("manual coupe between 20k and 40k");
  assert.equal(r.minPrice, 20_000);
  assert.equal(r.maxPrice, 40_000);
  assert.equal(r.transmission, "MANUAL");
});
