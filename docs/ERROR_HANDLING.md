# Error Handling with `better-result`

This project uses [`better-result`](https://github.com/dmorsing/better-result) — a Rust-inspired `Result<T, E>` library for TypeScript — to make error handling explicit and type-safe across the DB operations layer.

---

## Why `better-result` over raw try/catch

Raw try/catch in remote functions loses error type information by the time the error reaches the UI:

```ts
// Bad — error type is unknown, message may be mangled by KrakenD or service layer
try {
  await apiFetch('/api/hotel/customers', { method: 'POST', body });
} catch (e) {
  toast.error(e.message); // "Internal Server Error" or nothing useful
}
```

With `better-result`, each operation declares exactly what errors it can return:

```ts
// Good — error type is known, message is user-readable
const result = await createCustomer(data);
result.match({
  ok: (customer) => customer,
  err: (e) => { throw new Error(e.message); }, // "A customer with that id number already exists."
});
```

---

## `TaggedError` classes (`packages/db/src/errors/<domain>.ts`)

Each domain has its own error file exporting `TaggedError` subclasses:

```ts
import { TaggedError } from "better-result";

export class CustomerAlreadyExistsError extends TaggedError("CustomerAlreadyExistsError")<{
  field: string;
  message: string;
}>() {}

export class CustomerNotFoundError extends TaggedError("CustomerNotFoundError")<{
  id: string;
  message: string;
}>() {}

export class HotelDatabaseError extends TaggedError("HotelDatabaseError")<{
  operation: string;
  message: string;
  cause: unknown;
}>() {}

export type HotelError =
  | CustomerAlreadyExistsError
  | CustomerNotFoundError
  | HotelDatabaseError;
```

**Convention:** Every domain has a `*DatabaseError` as the catch-all for unexpected Mongoose errors.

---

## Operation function signature

All operations in `packages/db/src/operations/` return `Promise<Result<T, DomainError>>`:

```ts
export async function createCustomer(
  input: CreateCustomerInput
): Promise<Result<Customer, HotelError>> {
  return Result.tryPromise({
    try: () => Customer.create(input),
    catch: (e: any): HotelError => {
      if (e.code === 11000) {
        const field = Object.keys(e.keyPattern ?? {})[0] ?? "field";
        return new CustomerAlreadyExistsError({
          field,
          message: `A customer with that ${field.replace(/_/g, " ")} already exists.`,
        });
      }
      return new HotelDatabaseError({ operation: "createCustomer", cause: e, message: String(e) });
    },
  });
}
```

---

## Remote functions: unwrapping with `result.match`

Remote functions (`apps/*/src/lib/remote/*.remote.ts`) unwrap `Result` values using `result.match`. Throwing from `err` propagates the error to the SvelteKit RPC layer, which surfaces it as a toast in the UI.

```ts
function unwrap<T>(result) {
  return result.match({
    ok: (d) => d,
    err: (e) => { throw new Error(e.message); },
  });
}

export const createCustomer = command(schema, async (data) =>
  unwrap(await dbCreateCustomer(data))
);
```

---

## `Result.gen` for multi-step operations

Use `Result.gen` when an operation depends on the success of a prior one:

```ts
export async function createBooking(input: CreateBookingInput) {
  return Result.gen(async function* () {
    const customer  = yield* Result.await(getCustomer(input.customerId));
    const roomType  = yield* Result.await(getRoomType(input.roomTypeId));
    const available = yield* Result.await(checkAvailability(roomType._id, input.checkInDate, input.checkOutDate));
    const booking   = yield* Result.await(saveBooking({ customer, available, ...input }));
    return Result.ok(booking);
  });
}
```

If any `yield*` step returns `Err`, the generator short-circuits and the final `Result` is that error — no further steps run.

---

## The `DatabaseError` fallback convention

Every `catch` clause in `Result.tryPromise` must:
1. Check for known error codes/types first (e.g. `e.code === 11000` for duplicate key)
2. Fall back to the domain's `*DatabaseError` for anything unexpected

Never swallow errors silently — always pass `cause: e` to preserve the stack for debugging.

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Calling `result.unwrap()` — throws generic `ResultError` | Use `result.match` with a descriptive `throw new Error(e.message)` |
| Forgetting `Result.await` inside `Result.gen` | Every async step in a generator must be `yield* Result.await(...)` |
| Catching `unknown` without narrowing | Use `e instanceof Error ? e.message : String(e)` before passing to `DatabaseError` |
| Raw try/catch in a remote function | Always use operations from `@elmariam/db` which return `Result` |
