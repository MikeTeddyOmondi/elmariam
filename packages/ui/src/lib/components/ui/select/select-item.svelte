<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import Check from "lucide-svelte/icons/check";
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  let {
    ref = $bindable(null),
    class: className,
    value,
    label,
    children,
    ...restProps
  }: SelectPrimitive.ItemProps & { class?: string; children?: Snippet } = $props();
</script>

<SelectPrimitive.Item
  bind:ref
  {value}
  {label}
  class={cn(
    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className
  )}
  {...restProps}
>
  {#snippet children({ selected }: { selected: boolean })}
    <span class="absolute left-2 flex size-3.5 items-center justify-center">
      {#if selected}<Check class="size-4" />{/if}
    </span>
    {label ?? value}
  {/snippet}
</SelectPrimitive.Item>
