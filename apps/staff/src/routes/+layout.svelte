<script lang="ts">
  import { page } from '$app/stores';

  const isLoginPage = $derived($page.url.pathname.startsWith('/login'));
</script>

{#if isLoginPage}
  <slot />
{:else}
  <div class="layout">
    <main class="content">
      <slot />
    </main>
  </div>
{/if}

<style>
  .layout { display: flex; min-height: 100vh; font-family: system-ui, sans-serif; }
  .content { flex: 1; background: #f5f5f5; overflow-y: auto; }
</style>
