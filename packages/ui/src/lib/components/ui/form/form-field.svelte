<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className, children }: Props = $props();
</script>

<div class={cn("flex flex-col gap-2", className)}>
  {@render children?.()}
</div>
