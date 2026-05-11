<script lang="ts">
  import { getMyProfile } from '$lib/remote/account.remote';

  const profile = getMyProfile();
</script>

<h1>My Profile</h1>

{#await profile}
  <p>Loading…</p>
{:then p}
  <div class="card">
    <div class="row"><span>Name</span><strong>{p.firstname} {p.lastname}</strong></div>
    <div class="row"><span>Email</span><strong>{p.email}</strong></div>
    <div class="row"><span>ID Number</span><strong>{p.id_number}</strong></div>
    <div class="row"><span>Phone</span><strong>{p.phone_number || '—'}</strong></div>
  </div>
{:catch err}
  <p class="error">{err.message}</p>
{/await}

<style>
  h1 { margin: 0 0 1.5rem; color: #1a1a2e; }
  .card { background: #fff; border-radius: 8px; padding: 1.75rem; box-shadow: 0 1px 4px rgba(0,0,0,0.1); max-width: 440px; }
  .row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid #eee; font-size: 0.95rem; color: #555; }
  .row:last-child { border-bottom: none; }
  .row strong { color: #1a1a2e; }
  .error { color: red; }
</style>
