const baseUrl = (process.env.SMOKE_BASE_URL ?? "").replace(/\/+$/, "");

if (!/^https?:\/\//.test(baseUrl)) {
  throw new Error("SMOKE_BASE_URL must be an http or https URL.");
}

const applicationRoutes = [
  ["/", "Do the maths,"],
  ["/alloying/", "Alloy calculator controls"],
  ["/casting/", "Casting calculator controls"],
  ["/charcoal/", "Charcoal calculator controls"],
  ["/usage-finder/", "Usage Finder controls"],
  ["/feedback/", "feedback-heading"],
  ["/privacy/", "privacy-heading"]
];

const staticAssets = [
  ["/favicon.svg", "max-age=604800"],
  ["/favicon-16x16.png", "max-age=604800"],
  ["/favicon-32x32.png", "max-age=604800"],
  ["/og-image.png", "max-age=604800"],
  ["/site.webmanifest", "max-age=86400"],
  ["/sitemap.xml", "max-age=3600"]
];

const requestTimeoutMs = 15000;
const attempts = 6;
const retryDelayMs = 5000;

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function request(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(new URL(path, `${baseUrl}/`), {
      redirect: "follow",
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function expectHtml(path) {
  const response = await request(path);
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (response.status !== 200) {
    throw new Error(`${path} returned HTTP ${response.status}.`);
  }
  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error(`${path} returned an unexpected content type: ${contentType}.`);
  }
  if (!body.includes('id="app"')) {
    throw new Error(`${path} did not return the application shell.`);
  }

  return { body, response };
}

async function verifyProduction() {
  const root = await expectHtml("/");

  for (const [route] of applicationRoutes.slice(1)) {
    await expectHtml(route);
  }

  const scriptPaths = [...root.body.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((path) => path.startsWith("/assets/"));

  if (scriptPaths.length === 0) {
    throw new Error("The production shell does not reference a JavaScript bundle.");
  }

  const scriptBodies = [];
  for (const scriptPath of scriptPaths) {
    const response = await request(scriptPath);
    const body = await response.text();
    const cacheControl = response.headers.get("cache-control") ?? "";

    if (response.status !== 200) {
      throw new Error(`${scriptPath} returned HTTP ${response.status}.`);
    }
    if (!cacheControl.includes("max-age=31536000") || !cacheControl.includes("immutable")) {
      throw new Error(`${scriptPath} is missing the expected immutable cache header.`);
    }
    if (!body.trim()) {
      throw new Error(`${scriptPath} is empty.`);
    }
    scriptBodies.push(body);
  }

  const combinedBundle = scriptBodies.join("\n");
  for (const [, expectedContent] of applicationRoutes) {
    if (!combinedBundle.includes(expectedContent)) {
      throw new Error(
        `The production bundle did not contain the expected content: ${expectedContent}.`
      );
    }
  }

  for (const [assetPath, expectedCacheControl] of staticAssets) {
    const response = await request(assetPath);
    const body = await response.arrayBuffer();
    const cacheControl = response.headers.get("cache-control") ?? "";

    if (response.status !== 200) {
      throw new Error(`${assetPath} returned HTTP ${response.status}.`);
    }
    if (body.byteLength === 0) {
      throw new Error(`${assetPath} is empty.`);
    }
    if (!cacheControl.includes(expectedCacheControl)) {
      throw new Error(
        `${assetPath} is missing the expected cache header fragment ${expectedCacheControl}.`
      );
    }
  }
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verifyProduction();
    console.log(`Production smoke tests passed on attempt ${attempt}.`);
    process.exit(0);
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    if (attempt < attempts) {
      console.warn(`Smoke test attempt ${attempt} failed: ${lastError}`);
      await sleep(retryDelayMs);
    }
  }
}

throw new Error(`Production smoke tests failed after ${attempts} attempts: ${lastError}`);
