// Build the Elix favicon assets using the project's SVG brand.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const svg=fs.readFileSync(path.join(root,"site","elix-logo.svg"),"utf8");
function render(size){return Buffer.from(new Resvg(svg,{fitTo:{mode:"width",value:size}}).render().asPng());}
const big=render(192),small=render(64);
fs.writeFileSync(path.join(root,"site","favicon-192.png"),big);
const header=Buffer.alloc(22);
header.writeUInt16LE(0,0);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);
header[6]=64;header[7]=64;
header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);
header.writeUInt32LE(small.length,14);header.writeUInt32LE(22,18);
fs.writeFileSync(path.join(root,"site","favicon.ico"),Buffer.concat([header,small]));
console.log("Elix favicons generated");
