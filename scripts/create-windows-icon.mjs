import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const source = path.join(projectDirectory, "icons", "icon-512.png");
const destination = path.join(projectDirectory, "icons", "app-icon.ico");

const png = await readFile(source);
const ico = await pngToIco(png);
await writeFile(destination, ico);

console.log(`Ícone do Windows criado em ${destination}`);
