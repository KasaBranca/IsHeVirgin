# IsHeVirgin

[![Sponsor](https://img.shields.io/badge/Sponsor-KasaBranca-ea4aaa?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/KasaBranca)

**Give me money. I'm a virgin, Asian, and gay.**

Prints `Virgin` if `Virgin.md` exists on GitHub. Otherwise, `Not a virgin`.

```sh
npm install -g github:KasaBranca/IsHeVirgin
ishevirgin
```

## Aliases

The same command is installed under four names. They all run the same check, and
the name you invoke picks the pronoun.

```sh
ishevirgin someone      # He is a virgin
isshevirgin someone     # She is a virgin
istheyvirgin someone    # They are a virgin
isvirgin someone        # The subject is a virgin
```

Run without a target, the output stays the original single word.

## Checking someone else

Pass a target to check any repo that hosts a marker file. A bare owner is short
for `<owner>/IsHeVirgin`.

```sh
ishevirgin someone            # someone/IsHeVirgin
ishevirgin someone/theirrepo  # any repo
```

Without `--ref`, the repo's default branch is used. `--json` reports `"ref":
null` in that case, since the branch is resolved by GitHub rather than by the CLI.

## Options

| Option | Description |
| --- | --- |
| `--marker <file>` | Marker file to look for (default: `Virgin.md`) |
| `--ref <ref>` | Branch or tag to inspect (default: the repo's default branch) |
| `--json` | Machine-readable output |
| `-h`, `--help` | Show help |
| `-v`, `--version` | Show the version |

Set `GITHUB_TOKEN` to raise the GitHub API rate limit.
