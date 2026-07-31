<script lang="ts">
  import { cn } from "../../../utils.js";

  interface Issue {
    message: string;
  }

  interface Props {
    /**
     * Pass `myForm.fields.someField.issues()` straight through — it is
     * `undefined` when the field is valid or has not been touched.
     */
    issues?: Issue[];
    class?: string;
  }

  let { issues, class: className }: Props = $props();
</script>

{#if issues?.length}
  <div class={cn("flex flex-col gap-1", className)}>
    {#each issues as issue}
      <p class="text-sm font-medium text-destructive">{issue.message}</p>
    {/each}
  </div>
{/if}
