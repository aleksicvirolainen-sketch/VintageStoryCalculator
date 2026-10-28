<script lang="ts">
  import { getContext } from "svelte";

  const navigate = getContext<(routeId: string) => void>("navigate");
</script>

<section class="hero">
  <p class="hero-kicker">Open source &middot; No accounts &middot; Always free</p>
  <h2 class="hero-headline">Do the maths,<br />skip the guesswork.</h2>
  <p class="hero-lead">
    Precise calculators for Vintage Story &middot; alloy ratios, ingot casting, smelting
    temperatures. Everything you need before you light the forge.
  </p>
</section>

<section class="tools-section">
  <h2 class="section-label">Available Tools</h2>
  <div class="tools-grid">
    <a href="/alloying/" class="tool-card" on:click|preventDefault={() => navigate("alloying")}>
      <div class="tool-icon" aria-hidden="true">⚗️</div>
      <div class="tool-body">
        <h3>Alloying Calculator</h3>
        <p>
          Set a target ingot count and get exact nugget amounts for every alloy component. Supports
          Tin Bronze, Black Bronze, Bismuth Bronze, Electrum, and more.
        </p>
      </div>
      <span class="tool-arrow" aria-hidden="true">→</span>
    </a>
    <a href="/casting/" class="tool-card" on:click|preventDefault={() => navigate("casting")}>
      <div class="tool-icon" aria-hidden="true">🔩</div>
      <div class="tool-body">
        <h3>Casting Calculator</h3>
        <p>
          Work out how many ore nuggets you need to cast a given number of ingots. Shows smelting
          temperatures and ore sources for all castable metals.
        </p>
      </div>
      <span class="tool-arrow" aria-hidden="true">→</span>
    </a>
    <a href="/usage-finder/" class="tool-card" on:click|preventDefault={() => navigate("usage")}>
      <div class="tool-icon" aria-hidden="true">🔍</div>
      <div class="tool-body">
        <h3>Usage Finder</h3>
        <p>
          Enter the metals you have and discover every alloy and casting option available to you.
        </p>
      </div>
      <span class="tool-arrow" aria-hidden="true">→</span>
    </a>
    <a href="/charcoal/" class="tool-card" on:click|preventDefault={() => navigate("charcoal")}>
      <div class="tool-icon" aria-hidden="true">🔥</div>
      <div class="tool-body">
        <h3>Charcoal Calculator</h3>
        <p>
          Plan your charcoal production with precision. Calculate firewood needs, expected charcoal
          yield, and optimal pit dimensions.
        </p>
      </div>
      <span class="tool-arrow" aria-hidden="true">→</span>
    </a>
    <a href="/feedback/" class="tool-card" on:click|preventDefault={() => navigate("feedback")}>
      <div class="tool-icon" aria-hidden="true">✉️</div>
      <div class="tool-body">
        <h3>Feedback</h3>
        <p>Share bugs, ideas, and balancing notes through a simple form. No account required.</p>
      </div>
      <span class="tool-arrow" aria-hidden="true">→</span>
    </a>
    <a
      href="https://wiki.vintagestory.at/Main_Page"
      class="tool-card"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div class="tool-icon" aria-hidden="true">📚</div>
      <div class="tool-body">
        <h3>VS Wiki</h3>
        <p>
          Check out the Vintage Story Wiki for detailed info on ores, alloys, smelting, and more. An
          invaluable resource for any player!
        </p>
      </div>
      <span class="tool-arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>

<section class="community-section">
  <h2 class="section-label">Community Spotlight</h2>
  <div class="community-list">
    <a
      href="https://getstoryforge.app/"
      class="community-card"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div class="community-icon" aria-hidden="true">⚒️</div>
      <div class="community-body">
        <h3>StoryForge</h3>
        <p>
          An open-source Vintage Story launcher and mod manager. Handle profiles, mods, modpacks,
          world maps, and server hosting!
        </p>
      </div>
      <span class="community-arrow" aria-hidden="true">→</span>
    </a>
    <a
      href="https://the-cairn.com/"
      class="community-card"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div class="community-icon" aria-hidden="true">🗺️</div>
      <div class="community-body">
        <h3>Cairn</h3>
        <p>
          A free, community-driven Vintage Story map and toolkit. Explore server maps, plan
          translocator routes, track price history, and manage your waypoints!
        </p>
      </div>
      <span class="community-arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>

<div class="home-footer-note">
  <p>Built by a player, for players.</p>
  <p>
    Calculator results are computed locally from fixed game data, no AI is involved in the results.
  </p>
</div>
