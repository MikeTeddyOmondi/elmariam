<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../../utils.js";

  type Variant = "default" | "destructive";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    variant?: Variant;
    class?: string;
    children?: Snippet;
  }

  const variantClasses: Record<Variant, string> = {
    default: "bg-card text-foreground",
    destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  };

  let { variant = "default", class: className, children, ...restProps }: Props = $props();
</script>

<div
  role="alert"
  class={cn(
    "relative w-full rounded-lg border border-border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
    variantClasses[variant],
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
