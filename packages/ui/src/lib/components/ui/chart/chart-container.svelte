<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../../../utils.js';
  import type { ChartConfig } from './index.js';

  interface Props {
    config: ChartConfig;
    class?: string;
    children: Snippet;
  }
  let { config, class: className, children }: Props = $props();

  const style = $derived(
    Object.entries(config)
      .filter(([, v]) => v.color)
      .map(([k, v]) => `--color-${k}: ${v.color}`)
      .join('; ')
  );
</script>

<div {style} data-chart class={cn('flex w-full justify-center text-xs', className)}>
  {@render children()}
</div>
