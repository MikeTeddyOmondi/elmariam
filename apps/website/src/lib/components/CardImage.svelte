<script lang="ts">
  import ImageIcon from 'lucide-svelte/icons/image';

  let { src, alt }: { src?: string; alt: string } = $props();

  // A broken URL falls back to the placeholder instead of the browser's icon.
  // Keyed on the URL, so a new src gets a fresh attempt.
  let failedSrc = $state<string>();
  const showImage = $derived(!!src && src !== failedSrc);
</script>

<!-- Always the same 4:3 box, image or not, so cards line up and nothing
     shifts when the list replaces its loading skeletons. -->
<div class="relative aspect-[4/3] w-full overflow-hidden bg-muted">
  {#if showImage}
    <img {src} {alt} loading="lazy" class="h-full w-full object-cover" onerror={() => (failedSrc = src)} />
  {:else}
    <div class="flex h-full w-full items-center justify-center" aria-hidden="true">
      <ImageIcon class="size-8 text-muted-foreground/50" />
    </div>
  {/if}
</div>
