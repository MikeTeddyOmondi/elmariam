<script lang="ts">
  import type { HTMLSelectAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import { cn } from "../../../utils.js";

  /**
   * A styled native `<select>`.
   *
   * Deliberately not the bits-ui listbox: these selects live inside remote
   * `form()` submissions, which must still work with JavaScript disabled. A
   * JS-driven listbox renders nothing without JS and would submit an empty
   * value. Use bits-ui directly if you need a rich combobox somewhere that is
   * not part of a form.
   */
  type Props = HTMLSelectAttributes & {
    value?: string | number | null;
    class?: string;
    children?: Snippet;
  };

  let { value = $bindable(), class: className, children, ...restProps }: Props = $props();
</script>

<div class="relative">
  <select
    bind:value
    class={cn(
      "flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
      className
    )}
    {...restProps}
  >
    {@render children?.()}
  </select>
  <ChevronDown
    class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-50"
  />
</div>
