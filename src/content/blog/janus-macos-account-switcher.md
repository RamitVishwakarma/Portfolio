On 25 September 2026 I released Janus, a small macOS menu-bar app for people who keep more than one Claude Code or Codex account. Two weeks later it has 123 stars and 11 forks on GitHub, five releases behind it, and a how-to guide written by someone I have never met. This post covers why I built it, the keychain bug that nearly sank the first release, and how one git tag now ships a whole release.

## Why I built it

I use more than one Claude Code account. Moving between them meant signing out, signing in as the other account and typing the whole thing again, several times a day. Janus saves each account's session and puts it back on demand, so the second account is one click away instead of one login away.

It has three tabs:

- **Claude.** Switches Claude Code accounts and shows how much of each account's five-hour and weekly limits has been spent.
- **Codex.** Does the same for OpenAI's Codex.
- **Storage.** Measures developer caches that are safe to delete and moves the ones you pick to the Trash, so any decision can be taken back.

It is written in Swift and SwiftUI, uses system frameworks only, and is MIT licensed.

## How switching works

A signed-in Claude Code session is two things on disk:

| Part | Where it lives |
| --- | --- |
| OAuth tokens | Keychain entry `Claude Code-credentials` |
| Everything else | `~/.claude.json` |

Switching moves that pair. Janus copies the live pair into storage under the account it belongs to, then writes the other account's saved pair into place.

The order of those steps matters more than the steps themselves. Every switch fetches the replacement session before it touches anything live, and saves the session it is about to displace before overwriting it. If a step fails, for example a declined keychain prompt, the Mac stays signed into the account it was already using. If the live account is one Janus has never seen, it is saved as a new account instead of overwritten, because those credentials exist nowhere else.

The settings file belongs to another program and gains keys between releases, so Janus parses only what it needs and writes everything else back byte for byte.

## The keychain bug in 1.0.1

The day after launch, people reported repeated keychain password prompts, from Janus and from Claude Code itself.

Keychain entries carry a partition list that names the code allowed to open them. Writing entries through the Security framework quietly re-stamped that list with Janus's own signature. That shut Claude Code out of its own tokens, and shut Janus out again after every rebuild, because an ad-hoc signature changes with each build.

The fix was to write entries through `/usr/bin/security`, the same tool Claude Code uses, which leaves them in a partition both programs can reopen. Saved accounts are repaired the next time they are switched to. Version 1.0.1 also stopped a switch from overwriting the live session when the keychain refuses to hand over its tokens. Before that, a refusal looked the same as nobody being signed in.

## Usage numbers that do not lie

Claude Code writes your limits into its settings file while a session runs. For an account that is parked, those figures freeze at the moment you switched away and get more wrong every hour.

Since 1.1.0, **Refresh** calls Anthropic's usage endpoint once per account, using the tokens that account already has saved, and the label under each pair of bars says whether a figure was fetched or remembered. Janus never renews the signed-in account's token, because a running Claude Code session holds it and rotating it underneath that session breaks a sign-in that was working.

The window also keeps its own time. Countdowns tick down and a limit that passes its reset empties itself, instead of a row drawn at nine still claiming "resets in 2h 22m" at midnight.

## Codex has single-use refresh tokens

The Codex tab arrived in 1.2.0. Codex keeps its whole sign-in in `~/.codex/auth.json`, so switching swaps that one file, written owner-only and renamed into place so Codex never reads half of it.

The catch is that ChatGPT refresh tokens are single-use. The copy saved when an account was added stops working once Codex renews it. So Janus saves the live file again at the moment it is switched away from, which keeps switching back working. The README also warns against `codex logout`, which revokes the sign-in at OpenAI and kills the copy Janus just saved.

## One tag ships a release

Releases run on GitHub Actions when I push a `v*` tag:

1. `check-version.sh` refuses the tag if it disagrees with the `VERSION` file or the changelog, so a release can never ship one version while claiming another.
2. `swift test` runs all 145 XCTest cases.
3. The app is built as a universal binary for Apple silicon and Intel, then packaged as a DMG and a zip with SHA-256 checksums.
4. Release notes come from the changelog, and the release is published with the files attached.
5. A second job bumps the Homebrew cask, so `brew install --cask ramitvishwakarma/tap/janus` never lags behind.

I only have the Xcode Command Line Tools on my Mac, and `swift test` needs full Xcode, so the test suite runs in CI rather than locally.

## Two weeks in numbers

| Release | Date | What changed |
| --- | --- | --- |
| 1.0.0 | 25 Sep 2026 | First public release |
| 1.0.1 | 26 Sep 2026 | Keychain partition fix, safer switching |
| 1.1.0 | 27 Sep 2026 | Live usage figures, self-updating countdowns |
| 1.2.0 | 28 Sep 2026 | Codex tab |
| 1.2.1 | 5 Oct 2026 | Finds the session the way Claude Code does |

## What I learned

- **Order the steps so failure is boring.** Fetch the new state before touching the old one, and save what you are about to overwrite.
- **Write through the same tool as the program you share data with.** The keychain bug came from using a different API than Claude Code, not from a logic error.
- **Label stale data as stale.** A dash and "last reset 4h ago" is better than a confident wrong number.
- **Let the pipeline refuse mistakes.** The version check has already stopped one mismatched tag.

Janus is at [github.com/RamitVishwakarma/Janus](https://github.com/RamitVishwakarma/Janus), with its landing page at [janus.ramitvishwakarma.in](https://janus.ramitvishwakarma.in).
