#!/usr/bin/env node

const https = require("node:https");

const markerUrl =
  "https://api.github.com/repos/KasaBranca/IsHeVirgin/contents/Virgin.md?ref=main";

const request = https.request(
  markerUrl,
  {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      "Cache-Control": "no-cache",
      "User-Agent": "IsHeVirgin",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  },
  (response) => {
    response.resume();

    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log("Virgin");
      return;
    }

    if (response.statusCode === 404) {
      console.log("Not a virgin");
      return;
    }

    console.error(`Check failed (HTTP ${response.statusCode})`);
    process.exitCode = 1;
  },
);

request.setTimeout(10_000, () => {
  request.destroy(new Error("Request timed out"));
});

request.on("error", (error) => {
  console.error(`Check failed: ${error.message}`);
  process.exitCode = 1;
});

request.end();
