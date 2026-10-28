<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { CalculationMode } from "../types/index";

  export let mode: CalculationMode = "need";
  export let needLabel: string = "I need ingots";
  export let haveLabel: string = "I have nuggets";

  const dispatch = createEventDispatcher<{ change: { value: CalculationMode } }>();

  const handleClick = (selected: CalculationMode) => {
    if (selected === mode) return;
    dispatch("change", { value: selected });
  };

  const handleKeydown = (event: KeyboardEvent) => {
    const options: CalculationMode[] = ["need", "have"];
    const currentIndex = options.indexOf(mode);
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % options.length;
    } else {
      return;
    }
    event.preventDefault();
    dispatch("change", { value: options[nextIndex]! });
  };
</script>

<div
  class="mode-toggle"
  role="radiogroup"
  aria-label="Calculation direction"
  tabindex="0"
  on:keydown={handleKeydown}
>
  <button
    type="button"
    role="radio"
    aria-checked={mode === "need"}
    tabindex={mode === "need" ? 0 : -1}
    class:active={mode === "need"}
    on:click={() => handleClick("need")}
  >
    {needLabel}
  </button>
  <button
    type="button"
    role="radio"
    aria-checked={mode === "have"}
    tabindex={mode === "have" ? 0 : -1}
    class:active={mode === "have"}
    on:click={() => handleClick("have")}
  >
    {haveLabel}
  </button>
</div>
