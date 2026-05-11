<script lang="ts">
  import { getUsers } from '$lib/remote/users.remote';

  const users = getUsers();
</script>

<h1>Users</h1>

{#await users}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Type</th>
      </tr>
    </thead>
    <tbody>
      {#each data as user}
        <tr>
          <td>{user.firstname} {user.lastname}</td>
          <td>{user.email}</td>
          <td>{user.userType}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{:catch err}
  <p class="error">{err.message}</p>
{/await}

<style>
  h1 { margin: 0 0 1.5rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .error { color: red; }
</style>
