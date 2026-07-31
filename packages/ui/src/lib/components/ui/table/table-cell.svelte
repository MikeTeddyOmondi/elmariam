<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  // `HTMLAttributes` omits the cell-specific attributes, so they are declared
  // here — empty-state rows need `colspan` to span the table.
  interface Props extends HTMLAttributes<HTMLTableCellElement> {
    colspan?: number;
    rowspan?: number;
    class?: string;
    children?: Snippet;
  }

  let { class: className, children, ...restProps }: Props = $props();
</script>

<td
  class={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
  {...restProps}
>
  {@render children?.()}
</td>
