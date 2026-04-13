import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_STATUS,
  escapeHtml,
  normalizeProjectPayload,
  splitEntries,
  validateProjectPayload,
} from "./project-form.mjs";

test("splitEntries trims values and removes duplicates", () => {
  assert.deepEqual(splitEntries("Growth, Product\nGrowth,  Engineering "), [
    "Growth",
    "Product",
    "Engineering",
  ]);
});

test("normalizeProjectPayload keeps planned as the default status", () => {
  assert.equal(
    normalizeProjectPayload({
      name: "Launch blog redesign",
      lead: "",
      icon: "",
      description: "",
      teams: "",
      status: "",
      milestone: "",
      startDate: "",
      targetDate: "",
      members: "",
      resources: "",
    }).status,
    DEFAULT_STATUS
  );
});

test("validateProjectPayload enforces required name and timeline order", () => {
  assert.deepEqual(
    validateProjectPayload({
      name: "",
      startDate: "2026-03-15",
      targetDate: "2026-03-10",
    }),
    ["Project name is required.", "Target date must be on or after the start date."]
  );
});

test("escapeHtml encodes characters used in HTML and attributes", () => {
  assert.equal(
    escapeHtml(`5 < 6 & "quotes" and 'apostrophes' > tags`),
    "5 &lt; 6 &amp; &quot;quotes&quot; and &#39;apostrophes&#39; &gt; tags"
  );
});
