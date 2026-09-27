<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "../../../utils.js";

  /**
   * A styled native checkbox.
   *
   * Deliberately not the bits-ui checkbox: that renders a `<button>`, so it
   * cannot accept the `type="checkbox"` / `checked` attributes that
   * `field.as('checkbox')` spreads, and it submits nothing with JavaScript
   * disabled. Remote `form()` submissions need a real input.
   */
  type Props = HTMLInputAttributes & {
    checked?: boolean;
    class?: string;
  };

  // `checked` is passed through rather than bound: `field.as('checkbox')`
  // supplies it, and a `bind:` with its own default would clobber that value
  // every time the form re-rendered after a submission.
  let { checked = false, class: className, ...restProps }: Props = $props();
</script>

<!--
  Native appearance with `accent-color`, not `appearance-none` plus a
  `checked:bg-[url(...)]` data URI: that arbitrary variant did not compile under
  Tailwind v4, so a checked box rendered blank and looked untoggleable even
  though its value flipped. The browser draws the tick and reflects `:checked`
  on its own here, so there is nothing to compile away.
-->
<input
  type="checkbox"
  {checked}
  class={cn(
    "size-4 shrink-0 cursor-pointer rounded-sm accent-primary",
    "ring-offset-background transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...restProps}
/>
