<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import ChevronUp from "lucide-svelte/icons/chevron-up";
  import { cn } from "../../../utils.js";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: SelectPrimitive.ScrollUpButtonProps & { class?: string } = $props();
</script>

<SelectPrimitive.ScrollUpButton
  bind:ref
  class={cn("flex cursor-default items-center justify-center py-1", className)}
  {...restProps}
>
  <ChevronUp class="size-4" />
</SelectPrimitive.ScrollUpButton>
