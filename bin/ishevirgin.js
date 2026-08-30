#!/usr/bin/env node

const https = require("node:https");

const markerUrl =
  "https://raw.githubusercontent.com/KasaBranca/IsHeVirgin/main/Virgin.md";

const request = https.request(
  markerUrl,
  {
    method: "HEAD",
    headers: { "User-Agent": "IsHeVirgin" },
  },
  (response) => {
    response.resume();

    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log("童貞");
      return;
    }

    if (response.statusCode === 404) {
      console.log("非童貞");
      return;
    }

    console.error(`判定失敗 (HTTP ${response.statusCode})`);
    process.exitCode = 1;
  },
);

request.setTimeout(10_000, () => {
  request.destroy(new Error("タイムアウト"));
});

request.on("error", (error) => {
  console.error(`判定失敗: ${error.message}`);
  process.exitCode = 1;
});

request.end();
