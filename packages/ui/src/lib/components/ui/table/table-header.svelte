<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  interface Props extends HTMLAttributes<HTMLTableSectionElement> {
    class?: string;
    children?: Snippet;
  }

  let { class: className, children, ...restProps }: Props = $props();
</script>

<thead class={cn("[&_tr]:border-b [&_tr]:border-border", className)} {...restProps}>
  {@render children?.()}
</thead>
