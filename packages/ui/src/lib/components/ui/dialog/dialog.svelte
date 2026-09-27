<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import type { Snippet } from "svelte";
  import X from "lucide-svelte/icons/x";
  import { cn } from "../../../utils.js";

  interface Props {
    open?: boolean;
    title?: string;
    description?: string;
    /**
     * A submission is in flight. While true the dialog is not dismissable: no
     * Escape, no outside click, no close button. The caller closes it itself
     * once the post succeeds.
     */
    pending?: boolean;
    class?: string;
    /**
     * Called when the dialog is dismissed (Escape, outside click, close button).
     * Call sites drive visibility from their own state, so clear it here.
     */
    onclose?: () => void;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    title,
    description,
    pending = false,
    class: className,
    onclose,
    children
  }: Props = $props();
</script>

<DialogPrimitive.Root
  bind:open
  onOpenChange={(next: boolean) => {
    if (!next) onclose?.();
  }}
>
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogPrimitive.Content
      escapeKeydownBehavior={pending ? "ignore" : "close"}
      interactOutsideBehavior={pending ? "ignore" : "close"}
      class={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4",
        "max-h-[calc(100vh-2rem)] overflow-y-auto",
        "border border-border bg-card p-6 shadow-lg sm:rounded-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
    >
      {#if title || description}
        <div class="flex flex-col gap-1 text-left">
          {#if title}
            <DialogPrimitive.Title class="text-lg font-semibold leading-none tracking-tight text-card-foreground">
              {title}
            </DialogPrimitive.Title>
          {/if}
          {#if description}
            <DialogPrimitive.Description class="text-sm text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          {/if}
        </div>
      {/if}

      {@render children?.()}

      {#if !pending}
        <DialogPrimitive.Close
          class="absolute right-4 top-4 rounded-sm text-muted-foreground opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X class="size-4" />
          <span class="sr-only">Close</span>
        </DialogPrimitive.Close>
      {/if}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
