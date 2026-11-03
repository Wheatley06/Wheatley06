
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchContributions } from "./contributions.js";
import { renderPacmanSvg } from "./renderer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USERNAME = process.env.GITHUB_USERNAME || "Wheatley06";
const TOKEN = process.env.GITHUB_TOKEN;

// Permite indicar otra ruta mediante OUTPUT_FILE.
// Por defecto genera pacman/output/pacman-contributions.svg.
const OUTPUT_FILE = resolve(
  process.env.OUTPUT_FILE ||
  resolve(__dirname, "../output/pacman-contributions.svg")
);

async function main() {
  console.log("======================================");
  console.log(" PAC-MAN CONTRIBUTION GENERATOR");
  console.log("======================================");

  console.log(`GitHub user: ${USERNAME}`);

  if (!TOKEN) {
    throw new Error(
      "GITHUB_TOKEN is missing. Configure the environment variable before running."
    );
  }

  console.log("Fetching GitHub contributions...");

  const contributions = await fetchContributions(USERNAME, TOKEN);

  console.log(`Total contributions: ${contributions.totalContributions}`);
  console.log(`Days retrieved: ${contributions.days.length}`);

  console.log("Rendering SVG...");

  const svg = renderPacmanSvg({
    contributions: contributions.days,
  });

  if (!svg.includes("<svg") || !svg.includes("</svg>")) {
    throw new Error("The renderer did not produce a valid SVG document.");
  }

  await mkdir(dirname(OUTPUT_FILE), { recursive: true });

  await writeFile(OUTPUT_FILE, svg, "utf8");

  console.log("======================================");
  console.log(" SVG GENERATED SUCCESSFULLY");
  console.log("======================================");
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("PAC-MAN GENERATION FAILED:");
  console.error(error.message);
  process.exitCode = 1;
});
