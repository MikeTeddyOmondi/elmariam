<script lang="ts">
  import { Toaster as Sonner, type ToasterProps } from "svelte-sonner";

  /**
   * Single configured Toaster for every app. Previously each app rendered its
   * own `<Toaster richColors />` and imported `toast` straight from
   * svelte-sonner, so defaults could drift between them.
   */
  let { ...restProps }: ToasterProps = $props();
</script>

<Sonner
  richColors
  closeButton
  position="top-right"
  duration={4000}
  toastOptions={{
    classes: {
      toast: "bg-card text-card-foreground border-border",
      description: "text-muted-foreground"
    }
  }}
  {...restProps}
/>
