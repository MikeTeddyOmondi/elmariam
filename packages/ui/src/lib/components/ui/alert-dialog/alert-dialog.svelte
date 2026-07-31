<script lang="ts">
  import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
  import type { Snippet } from "svelte";
  import { buttonVariants } from "../button/button.svelte";
  import { cn } from "../../../utils.js";

  interface Props {
    open?: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Styles the confirm button for an irreversible action. */
    destructive?: boolean;
    /** Disables the confirm button, e.g. while the action is in flight. */
    pending?: boolean;
    /**
     * Id of a `<form>` this dialog should submit on confirm.
     *
     * The dialog content is portalled out of the DOM position it was written
     * in, so it cannot be a descendant of the form. The HTML `form` attribute
     * associates them by id regardless of nesting.
     */
    confirmForm?: string;
    onconfirm?: () => void;
    /** Optional extra content rendered between the description and the buttons. */
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    destructive = false,
    pending = false,
    confirmForm,
    onconfirm,
    children
  }: Props = $props();
</script>

<AlertDialogPrimitive.Root bind:open>
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <AlertDialogPrimitive.Content
      class={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4",
        "border border-border bg-card p-6 shadow-lg sm:rounded-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      )}
    >
      <div class="flex flex-col gap-2 text-center sm:text-left">
        <AlertDialogPrimitive.Title class="text-lg font-semibold text-card-foreground">
          {title}
        </AlertDialogPrimitive.Title>
        {#if description}
          <AlertDialogPrimitive.Description class="text-sm text-muted-foreground">
            {description}
          </AlertDialogPrimitive.Description>
        {/if}
      </div>

      {@render children?.()}

      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AlertDialogPrimitive.Cancel class={buttonVariants({ variant: "outline" })}>
          {cancelLabel}
        </AlertDialogPrimitive.Cancel>
        <AlertDialogPrimitive.Action
          class={buttonVariants({ variant: destructive ? "destructive" : "default" })}
          disabled={pending}
          type={confirmForm ? "submit" : "button"}
          form={confirmForm}
          onclick={() => onconfirm?.()}
        >
          {confirmLabel}
        </AlertDialogPrimitive.Action>
      </div>
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
</AlertDialogPrimitive.Root>
