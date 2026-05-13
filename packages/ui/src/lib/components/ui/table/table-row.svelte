<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  interface Props extends HTMLAttributes<HTMLTableRowElement> {
    class?: string;
    children?: Snippet;
  }

  let { class: className, children, ...restProps }: Props = $props();
</script>

<tr
  class={cn(
    "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
    className
  )}
  {...restProps}
>
  {@render children?.()}
</tr>
