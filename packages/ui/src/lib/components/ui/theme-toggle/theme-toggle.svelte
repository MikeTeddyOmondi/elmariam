<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';
  import { cn } from '../../../utils.js';

  interface Props { class?: string }
  let { class: className }: Props = $props();

  let isDark = $state(
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );

  function toggle() {
    isDark = !isDark;
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
      try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (_) {}
    }
  }
</script>

<button
  onclick={toggle}
  class={cn(
    'inline-flex items-center justify-center rounded-md size-9 transition-colors',
    'text-muted-foreground hover:text-foreground hover:bg-accent/10',
    className
  )}
  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {#if isDark}
    <Sun class="size-4" />
  {:else}
    <Moon class="size-4" />
  {/if}
</button>
