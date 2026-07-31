/**
 * Form primitives for SvelteKit remote `form()` functions.
 *
 * Stock shadcn-svelte `Form.*` is built on formsnap + sveltekit-superforms.
 * This project validates with the remote function's own valibot schema, so
 * these read from `RemoteForm.fields` instead — no second validation layer.
 *
 * ```svelte
 * <form {...createDrink}>
 *   <Form.Field>
 *     <Label for="name">Name</Label>
 *     <Input id="name" {...createDrink.fields.name.as('text')} />
 *     <Form.FieldErrors issues={createDrink.fields.name.issues()} />
 *   </Form.Field>
 * </form>
 * ```
 */
import Field from "./form-field.svelte";
import FieldErrors from "./form-field-errors.svelte";
import Message from "./form-message.svelte";

export {
  Field,
  FieldErrors,
  Message,
  //
  Field as FormField,
  FieldErrors as FormFieldErrors,
  Message as FormMessage
};
