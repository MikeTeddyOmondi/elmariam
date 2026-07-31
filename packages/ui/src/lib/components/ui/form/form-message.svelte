<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  interface Props {
    /** Form-level issues, i.e. `myForm.fields.issues()` or `invalid('...')`. */
    issues?: { message: string }[];
    class?: string;
    children?: Snippet;
  }

  let { issues, class: className, children }: Props = $props();
</script>

{#if issues?.length || children}
  <div
    class={cn(
      "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive",
      className
    )}
    role="alert"
  >
    {#if issues?.length}
      {#each issues as issue}
        <p>{issue.message}</p>
      {/each}
    {:else}
      {@render children?.()}
    {/if}
  </div>
{/if}
