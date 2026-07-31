<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { cn } from "../../../utils.js";

  // `value` is widened from `string`: `field.as('text')` spreads
  // `string | number`, matching what `Input` already accepts.
  type Props = HTMLTextareaAttributes & {
    value?: unknown;
    class?: string;
  };

  let { value = $bindable(), class: className, ...restProps }: Props = $props();
</script>

<textarea
  bind:value
  class={cn(
    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
    "ring-offset-background placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
    className
  )}
  {...restProps}
></textarea>
