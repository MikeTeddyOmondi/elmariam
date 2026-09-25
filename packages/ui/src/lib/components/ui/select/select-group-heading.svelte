<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: SelectPrimitive.GroupHeadingProps & { class?: string; children?: Snippet } = $props();
</script>

<SelectPrimitive.GroupHeading
  bind:ref
  class={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}
  {...restProps}
>
  {@render children?.()}
</SelectPrimitive.GroupHeading>
