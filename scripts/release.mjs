import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const repositoryUrl = "https://codeberg.org/D-Heger/VintageStoryCalculator";
const stableVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const headerPattern =
  /^(?<type>[a-z]+)(?:\((?<scope>[^()]+)\))?(?<breaking>!)?: (?<description>\S.*)$/i;
const breakingFooterPattern = /^BREAKING[ -]CHANGE: /m;
const bumpRank = { none: 0, patch: 1, minor: 2, major: 3 };
const changelogSections = [
  { title: "Breaking changes", includes: (commit) => commit.breaking },
  { title: "Features", includes: (commit) => commit.type === "feat" },
  { title: "Fixes", includes: (commit) => commit.type === "fix" || commit.type === "revert" },
  { title: "Performance", includes: (commit) => commit.type === "perf" },
  { title: "Other changes", includes: () => true }
];

function parseStableVersion(text) {
  const match = stableVersionPattern.exec(text);
  return match ? match.slice(1).map(Number) : null;
}

function compareVersions(a, b) {
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

export function parseCommit(sha, rawMessage) {
  const [header, ...body] = rawMessage.replace(/\r\n/g, "\n").trim().split("\n");
  const match = headerPattern.exec(header);
  return {
    sha,
    type: match?.groups.type.toLowerCase(),
    scope: match?.groups.scope,
    description: match ? match.groups.description : header,
    breaking: Boolean(match?.groups.breaking) || breakingFooterPattern.test(body.join("\n"))
  };
}

function bumpFor(commit) {
  if (commit.breaking) return "major";
  if (commit.type === "feat") return "minor";
  if (commit.type === "fix" || commit.type === "perf" || commit.type === "revert") return "patch";
  return "none";
}

export function determineBump(commits) {
  return commits.reduce((highest, commit) => {
    const bump = bumpFor(commit);
    return bumpRank[bump] > bumpRank[highest] ? bump : highest;
  }, "none");
}

export function nextVersion([major, minor, patch], bump) {
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function formatEntry(commit) {
  const scope = commit.scope ? `**${commit.scope}:** ` : "";
  return `- ${scope}${commit.description} ([${commit.sha.slice(0, 7)}](${repositoryUrl}/commit/${commit.sha}))`;
}

export function buildChangelog(commits) {
  const groups = changelogSections.map((section) => ({ title: section.title, entries: [] }));
  for (const commit of commits) {
    const index = changelogSections.findIndex((section) => section.includes(commit));
    groups[index].entries.push(formatEntry(commit));
  }
  const sections = groups
    .filter((group) => group.entries.length > 0)
    .map((group) => `### ${group.title}\n\n${group.entries.join("\n")}`);
  return `${sections.join("\n\n")}\n`;
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function latestStableRelease() {
  let latest = null;
  for (const tag of git("tag", "--list").split("\n").filter(Boolean)) {
    const version = parseStableVersion(tag);
    if (version && (!latest || compareVersions(version, latest.version) > 0)) {
      latest = { tag, version };
    }
  }
  return latest;
}

function commitsSince(release) {
  const range = release ? `refs/tags/${release.tag}..HEAD` : "HEAD";
  const records = git("log", "--no-merges", "--format=%x1e%H%x1f%B", range).split("\x1e");
  return records
    .filter((record) => record.includes("\x1f"))
    .map((record) => {
      const separator = record.indexOf("\x1f");
      return parseCommit(record.slice(0, separator), record.slice(separator + 1));
    });
}

function main(args) {
  const latest = latestStableRelease();

  if (args.includes("--latest")) {
    if (!latest) {
      throw new Error("No stable release tag (X.Y.Z) exists in this repository.");
    }
    process.stdout.write(`${latest.tag}\n`);
    return;
  }

  const payloadFlag = args.indexOf("--payload");
  const payloadPath = payloadFlag === -1 ? undefined : args[payloadFlag + 1];
  if (payloadFlag !== -1 && !payloadPath) {
    throw new Error("--payload needs a file path.");
  }

  const since = latest ? latest.tag : "the first commit";
  const commits = commitsSince(latest);
  const bump = determineBump(commits);
  if (bump === "none") {
    console.log(`No releasable commits since ${since}.`);
    return;
  }

  const version = nextVersion(latest ? latest.version : [0, 0, 0], bump);
  console.log(`Next release: ${version} (${bump} bump from ${since}).`);

  if (payloadPath) {
    const payload = {
      tag_name: version,
      target_commitish: git("rev-parse", "HEAD").trim(),
      name: `Release ${version}`,
      body: buildChangelog(commits),
      draft: false,
      prerelease: false
    };
    writeFileSync(payloadPath, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Wrote the release payload to ${payloadPath}.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
