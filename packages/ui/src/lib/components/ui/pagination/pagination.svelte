<script lang="ts">
  import { Button } from "../button/index.js";
  import ChevronLeft from "lucide-svelte/icons/chevron-left";
  import ChevronRight from "lucide-svelte/icons/chevron-right";

  /**
   * Reusable pager. Owns nothing but the page number: the caller slices its own
   * data, so this works for client-side and server-side paging alike.
   *
   * Adapted from locci-platform's Pagination for shared use across the apps.
   */
  let {
    page = $bindable(1),
    total,
    perPage = 20,
    label = "items"
  }: { page?: number; total: number; perPage?: number; label?: string } = $props();

  let pageCount = $derived(Math.max(1, Math.ceil(total / perPage)));
  let first = $derived(total === 0 ? 0 : (page - 1) * perPage + 1);
  let last = $derived(Math.min(page * perPage, total));

  // Clamp if the data shrank under us (e.g. after a delete on the last page).
  $effect(() => {
    if (page > pageCount) page = pageCount;
  });
</script>

{#if total > 0}
  <div class="flex flex-wrap items-center justify-between gap-3 pt-3">
    <p class="text-xs text-muted-foreground">
      {first}-{last} of {total}
      {label}
    </p>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onclick={() => (page = Math.max(1, page - 1))}
      >
        <ChevronLeft class="h-4 w-4" />
        Previous
      </Button>
      <span class="text-xs text-muted-foreground">Page {page} of {pageCount}</span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onclick={() => (page = Math.min(pageCount, page + 1))}
      >
        Next
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>
{/if}
