<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    variant?: Variant;
    class?: string;
    children?: Snippet;
  }

  const variantClasses: Record<Variant, string> = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
    success: "border-transparent bg-emerald-600/20 text-emerald-400",
    warning: "border-transparent bg-amber-600/20 text-amber-400",
  };

  let { variant = "default", class: className, children, ...restProps }: Props = $props();
</script>

<div
  class={cn(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
    variantClasses[variant],
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
