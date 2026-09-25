import { toast } from "svelte-sonner";

export { default as Toaster } from "./sonner.svelte";
export { toast };

/**
 * Turns a thrown error into a user-facing toast.
 *
 * Call sites used to do `toast.error(err.message || 'An error occurred')`,
 * which rendered the generic fallback for every SvelteKit `error()`: including
 * the 403s that the RBAC guards now raise routinely for read-only roles.
 */
export function toastError(err: unknown, fallback = "Something went wrong."): void {
  toast.error(messageFor(err, fallback));
}

/**
 * Toasts the form-level issues from a rejected `form()` submission.
 *
 * For a form rendered on the page, `Form.Message` shows these inline. A delete
 * confirmed through `AlertDialog` has no visible form to render them in: the
 * `<form>` is a hidden element holding only the id, so without this a refused
 * delete (the dependant checks in `packages/db`) failed silently and the dialog
 * just sat there.
 *
 * Pass `myForm.fields.allIssues()`. Only the path-less entries are shown, for
 * the same reason as `Form.Message`: field issues belong under their input.
 */
export function toastIssues(
  issues: readonly { message: string; path?: readonly unknown[] }[] | undefined,
  fallback = "That could not be completed."
): void {
  const formLevel = issues?.filter((i) => !i.path?.length) ?? [];
  if (formLevel.length === 0) {
    toast.error(fallback);
    return;
  }
  for (const issue of formLevel) toast.error(issue.message);
}

/** The message `toastError` would show. Exported for inline error rendering. */
export function messageFor(err: unknown, fallback = "Something went wrong."): string {
  const status = statusOf(err);

  // Status wins over the server's text: these three are actionable in a way
  // the raw message usually is not.
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "That item could not be found.";

  const body = bodyMessageOf(err);
  if (body) return body;

  if (status && status >= 500) return "The server had a problem. Please try again.";

  return fallback;
}

function statusOf(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const status = (err as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

/**
 * SvelteKit's `error(status, message)` surfaces as `{ status, body: { message } }`
 * on the client, not as `err.message`: which is why the old call sites always
 * fell through to their generic fallback.
 */
function bodyMessageOf(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;

  const body = (err as { body?: unknown }).body;
  if (typeof body === "object" && body !== null) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  const message = (err as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;

  return undefined;
}
