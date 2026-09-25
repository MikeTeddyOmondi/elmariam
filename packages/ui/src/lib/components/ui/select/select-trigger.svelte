<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: SelectPrimitive.TriggerProps & { class?: string; children?: Snippet } = $props();
</script>

<SelectPrimitive.Trigger
  bind:ref
  class={cn(
    "flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
    "ring-offset-background placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:focus:ring-destructive",
    "[&>span]:line-clamp-1",
    className
  )}
  {...restProps}
>
  {@render children?.()}
  <ChevronDown class="size-4 shrink-0 opacity-50" />
</SelectPrimitive.Trigger>
