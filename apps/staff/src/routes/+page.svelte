<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    const userType = document.cookie
      .split('; ')
      .find((c) => c.startsWith('user_type='))
      ?.split('=')[1];

    if (userType === 'receptionist' || userType === 'management') {
      goto('/receptionist');
    } else if (userType === 'barista') {
      goto('/barista');
    } else if (userType === 'waiter') {
      goto('/waiter');
    } else {
      goto('/login');
    }
  });
</script>

<p>Redirecting…</p>
