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

<input
  type="checkbox"
  {checked}
  class={cn(
    "size-4 shrink-0 cursor-pointer appearance-none rounded-sm border border-primary",
    "ring-offset-background transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "checked:bg-primary checked:text-primary-foreground",
    // The tick is drawn with a background image so no extra markup is needed.
    "checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%2220 6 9 17 4 12%22/%3E%3C/svg%3E')]",
    "checked:bg-center checked:bg-no-repeat",
    className
  )}
  {...restProps}
/>
