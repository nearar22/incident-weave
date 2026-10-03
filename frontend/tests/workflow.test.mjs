import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");

test("uses Studio Next and finalized transaction tracking",()=>{assert.match(app,/61997/);assert.match(app,/studio-next\.genlayer\.com/);assert.match(app,/trackUntil="finalized"/)});
test("ships the entire incident lifecycle",()=>{for(const name of ["open_incident","synthesize","add_witness_source","seal","get_incident"])assert.match(app,new RegExp(name))});
test("keeps source inputs editable and bounded",()=>{assert.match(app,/sources\.length<4/);assert.match(app,/Status source/);assert.match(app,/Witness source URL/)});
test("contains no simulated incident result",()=>assert.doesNotMatch(app,/mock incident|fake result|simulated weave/i));
test("has a distinct responsive dark console",()=>{assert.match(css,/--lime:#a8ff3e/);assert.match(css,/\.timeline/);assert.match(css,/prefers-reduced-motion/)});
