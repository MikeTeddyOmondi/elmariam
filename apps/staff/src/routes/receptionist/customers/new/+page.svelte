<script lang="ts">
  import { createCustomer } from '$lib/remote/hotel.remote';

  let firstname = $state('');
  let lastname = $state('');
  let id_number = $state('');
  let email = $state('');
  let phone_number = $state('');
  let error = $state('');
  let success = $state('');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    success = '';
    try {
      await createCustomer({ firstname, lastname, id_number, email, phone_number: phone_number || undefined });
      success = 'Customer created successfully.';
      firstname = lastname = id_number = email = phone_number = '';
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<a href="/receptionist/customers" class="back">← Back</a>
<h1>New Customer</h1>

{#if success}<p class="success">{success}</p>{/if}
{#if error}<p class="error">{error}</p>{/if}

<form onsubmit={submit} class="form">
  <label>First Name <input bind:value={firstname} required /></label>
  <label>Last Name <input bind:value={lastname} required /></label>
  <label>ID Number <input bind:value={id_number} required /></label>
  <label>Email <input type="email" bind:value={email} required /></label>
  <label>Phone <input bind:value={phone_number} /></label>
  <button type="submit">Create Customer</button>
</form>

<style>
  .back { color: #0f3460; text-decoration: none; font-size: 0.9rem; }
  h1 { margin: 1rem 0 1.5rem; }
  .form { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); max-width: 480px; display: flex; flex-direction: column; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; color: #555; }
  input { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
  button { background: #0f3460; color: #fff; border: none; padding: 0.75rem; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  .success { color: #27ae60; }
  .error { color: red; }
</style>
