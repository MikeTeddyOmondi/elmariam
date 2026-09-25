<script lang="ts" module>
  export type SelectOption = { value: string; label: string; disabled?: boolean };
</script>

<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import SelectTrigger from "./select-trigger.svelte";
  import SelectContent from "./select-content.svelte";
  import SelectItem from "./select-item.svelte";

  /**
   * A single-choice Select wired for remote `form()` fields.
   *
   * Spread `myForm.fields.x.as('select')` onto it: `name` goes to the bits-ui
   * root, which renders the hidden input that carries the value into FormData,
   * and `aria-invalid` goes to the trigger so an invalid field styles itself.
   *
   * `items` is passed to the root as well as rendered, so the trigger keeps
   * showing the selected label once the menu closes.
   */
  interface Props {
    items: SelectOption[];
    name?: string;
    value?: string;
    placeholder?: string;
    id?: string;
    disabled?: boolean;
    required?: boolean;
    class?: string;
    "aria-invalid"?: boolean | "true" | "false";
  }

  let {
    items,
    name,
    value = $bindable(""),
    placeholder = "Select an option",
    id,
    disabled,
    required,
    class: className,
    "aria-invalid": ariaInvalid,
    ...restProps
  }: Props = $props();

  const selectedLabel = $derived(items.find((i) => i.value === value)?.label);
</script>

<SelectPrimitive.Root type="single" {name} {items} {disabled} {required} bind:value {...restProps}>
  <SelectTrigger {id} class={className} aria-invalid={ariaInvalid}>
    {#if selectedLabel}
      <span>{selectedLabel}</span>
    {:else}
      <span class="text-muted-foreground">{placeholder}</span>
    {/if}
  </SelectTrigger>
  <SelectContent>
    {#each items as item (item.value)}
      <SelectItem value={item.value} label={item.label} disabled={item.disabled} />
    {/each}
  </SelectContent>
</SelectPrimitive.Root>
