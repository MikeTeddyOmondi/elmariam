<script lang="ts">
  import { Checkbox as CheckboxPrimitive } from "bits-ui";
  import Check from "lucide-svelte/icons/check";
  import Minus from "lucide-svelte/icons/minus";
  import { cn } from "../../../utils.js";

  type Props = Omit<CheckboxPrimitive.RootProps, "children"> & { class?: string };

  let {
    checked = $bindable(false),
    indeterminate = $bindable(false),
    class: className,
    ...restProps
  }: Props = $props();
</script>

<CheckboxPrimitive.Root
  bind:checked
  bind:indeterminate
  class={cn(
    "peer size-4 shrink-0 rounded-sm border border-primary ring-offset-background",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
    className
  )}
  {...restProps}
>
  {#snippet children()}
    <div class="flex size-full items-center justify-center text-current">
      {#if indeterminate}
        <Minus class="size-3.5" />
      {:else if checked}
        <Check class="size-3.5" />
      {/if}
    </div>
  {/snippet}
</CheckboxPrimitive.Root>
