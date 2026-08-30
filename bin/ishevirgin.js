#!/usr/bin/env node

const https = require("node:https");
const path = require("node:path");

const DEFAULT_OWNER = "KasaBranca";
const DEFAULT_REPO = "IsHeVirgin";
const DEFAULT_MARKER = "Virgin.md";
const REQUEST_TIMEOUT_MS = 10_000;
const NAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const RATE_LIMIT_MESSAGE = "GitHub API rate limit reached. Set GITHUB_TOKEN to raise it.";

// The command name decides the pronoun, so one binary can speak about anyone
const PRONOUNS = {
  ishevirgin: { subject: "He", verb: "is" },
  isshevirgin: { subject: "She", verb: "is" },
  istheyvirgin: { subject: "They", verb: "are" },
  isvirgin: { subject: "The subject", verb: "is" },
};

const HELP = `IsHeVirgin - checks whether ${DEFAULT_MARKER} exists

Usage:
  ishevirgin [target] [options]

Targets:
  (none)            ${DEFAULT_OWNER}/${DEFAULT_REPO}
  <owner>           <owner>/${DEFAULT_REPO}
  <owner>/<repo>    any repo that hosts a marker file

Options:
      --marker <file> marker file to look for (default: ${DEFAULT_MARKER})
      --ref <ref>     branch or tag to inspect (default: the repo's default branch)
      --json          machine-readable output
  -h, --help          show this help
  -v, --version       show the version

Aliases:
  ishevirgin, isshevirgin, istheyvirgin, isvirgin
  All four run the same check. The name you invoke picks the pronoun.

Set GITHUB_TOKEN to raise the GitHub API rate limit.`;

// Returns the pronoun set matching the command name the user invoked
function pronounFor(argv1) {
  const invokedAs = path.basename(String(argv1 || ""), path.extname(String(argv1 || ""))).toLowerCase();
  return PRONOUNS[invokedAs] || PRONOUNS.ishevirgin;
}

// Rejects any value that would not survive as a single GitHub path segment
function requireName(value, label) {
  if (!NAME_PATTERN.test(value)) throw new Error(`Invalid ${label} "${value}"`);
  return value;
}

// Expands a bare owner or an owner/repo pair into an explicit target
function parseTarget(value) {
  if (!value) return { owner: DEFAULT_OWNER, repo: DEFAULT_REPO };

  const parts = value.split("/");
  if (parts.length > 2) throw new Error(`Invalid target "${value}", expected <owner> or <owner>/<repo>`);

  return { owner: requireName(parts[0], "owner"), repo: parts.length === 2 ? requireName(parts[1], "repo") : DEFAULT_REPO };
}

// Parses argv into CLI options, throwing on anything unrecognized
function parseArgs(argv) {
  const options = { target: null, marker: DEFAULT_MARKER, ref: null, json: false, help: false, version: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const takeValue = () => {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("-")) throw new Error(`Option ${arg} needs a value`);
      index += 1;
      return value;
    };

    switch (arg) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-v":
      case "--version":
        options.version = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--marker":
        options.marker = requireName(takeValue(), "marker");
        break;
      case "--ref":
        options.ref = takeValue();
        break;
      default:
        if (arg.startsWith("-")) throw new Error(`Unknown option ${arg}`);
        if (options.target !== null) throw new Error("Only one target may be given");
        options.target = arg;
    }
  }

  return { ...options, ...parseTarget(options.target) };
}

// Performs a GitHub API GET and resolves with the status code, headers and raw body
function githubRequest(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      Accept: "application/vnd.github+json",
      "Cache-Control": "no-cache",
      "User-Agent": "IsHeVirgin",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    const request = https.request(url, { method: "GET", headers }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ statusCode: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString("utf8") }));
    });

    request.setTimeout(REQUEST_TIMEOUT_MS, () => request.destroy(new Error("Request timed out")));
    request.on("error", reject);
    request.end();
  });
}

// Reports whether the target repo exists, so a 404 on the marker can be told apart from a bad target
async function repoExists(repoUrl) {
  const response = await githubRequest(repoUrl);

  if (response.statusCode === 403 && response.headers["x-ratelimit-remaining"] === "0") throw new Error(RATE_LIMIT_MESSAGE);

  return response.statusCode >= 200 && response.statusCode < 300;
}

// Resolves whether the marker file currently exists, letting the API pick the default branch when no ref is given
async function checkMarker(options) {
  const repoUrl = `https://api.github.com/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(options.repo)}`;
  const query = options.ref ? `?ref=${encodeURIComponent(options.ref)}` : "";
  const response = await githubRequest(`${repoUrl}/contents/${encodeURIComponent(options.marker)}${query}`);

  if (response.statusCode >= 200 && response.statusCode < 300) return true;
  if (response.statusCode === 403 && response.headers["x-ratelimit-remaining"] === "0") throw new Error(RATE_LIMIT_MESSAGE);

  // A missing repo answers 404 exactly like a missing marker, so the repo is looked up only to explain that case
  if (response.statusCode === 404) {
    if (!(await repoExists(repoUrl))) throw new Error(`No such repo: ${options.owner}/${options.repo}`);
    return false;
  }

  throw new Error(`Check failed (HTTP ${response.statusCode})`);
}

// Runs the check, keeping the original bare output for the default target
async function runCheck(options, pronoun) {
  const virgin = await checkMarker(options);

  if (options.json) {
    console.log(JSON.stringify({ repo: `${options.owner}/${options.repo}`, marker: options.marker, ref: options.ref, virgin }, null, 2));
    return;
  }

  if (options.owner === DEFAULT_OWNER && options.repo === DEFAULT_REPO) {
    console.log(virgin ? "Virgin" : "Not a virgin");
    return;
  }

  console.log(`${pronoun.subject} ${pronoun.verb} ${virgin ? "a virgin" : "not a virgin"}`);
}

// Entry point wiring argument parsing, the pronoun and the check together
async function main() {
  const pronoun = pronounFor(process.argv[1]);
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(HELP);
    return;
  }

  if (options.version) {
    console.log(require("../package.json").version);
    return;
  }

  await runCheck(options, pronoun);
}

main().catch((error) => {
  console.error(error.message.startsWith("Check failed") ? error.message : `Check failed: ${error.message}`);
  process.exitCode = 1;
});
