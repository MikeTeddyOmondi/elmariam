<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  interface Props {
    open?: boolean;
    onclose?: () => void;
    title?: string;
    description?: string;
    class?: string;
    children?: Snippet;
  }

  let { open = false, onclose, title, description, class: className, children }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onclose?.();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose?.();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center"
    role="dialog"
    aria-modal="true"
    onkeydown={handleKeydown}
    tabindex="-1"
  >
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
      onclick={handleBackdropClick}
      aria-hidden="true"
    ></div>
    <div
      class={cn(
        "relative z-10 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg",
        className
      )}
    >
      {#if title}
        <h2 class="text-lg font-semibold leading-none tracking-tight text-card-foreground mb-1">
          {title}
        </h2>
      {/if}
      {#if description}
        <p class="text-sm text-muted-foreground mb-4">{description}</p>
      {/if}
      {@render children?.()}
    </div>
  </div>
{/if}
