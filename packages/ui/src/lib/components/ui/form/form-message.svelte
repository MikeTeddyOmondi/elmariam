<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  interface Props {
    /**
     * Pass `myForm.fields.allIssues()`.
     *
     * There is no form-level-only accessor in the remote-function API: a bare
     * string given to `invalid()` lands in `allIssues()` with no `path`, while
     * a field's own issue carries one. This component renders only the
     * path-less entries, so domain failures show here and field errors stay
     * inline under their input instead of appearing twice.
     *
     * Note that `fields.issues` is NOT the form-level accessor. Any property
     * read on `fields` returns a field proxy, so `fields.issues?.()` yields a
     * proxy for a field named "issues" and throws "is not a function" when
     * called, taking the whole page down at hydration.
     */
    issues?: readonly { message: string; path?: readonly unknown[] }[];
    class?: string;
    children?: Snippet;
  }

  let { issues, class: className, children }: Props = $props();

  const formIssues = $derived(issues?.filter((i) => !i.path?.length) ?? []);
</script>

{#if formIssues.length || children}
  <div
    class={cn(
      "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive",
      className
    )}
    role="alert"
  >
    {#if formIssues.length}
      {#each formIssues as issue}
        <p>{issue.message}</p>
      {/each}
    {:else}
      {@render children?.()}
    {/if}
  </div>
{/if}
