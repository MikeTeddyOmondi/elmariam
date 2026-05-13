<script lang="ts">
  const features = [
    {
      icon: "🛏️",
      title: "Comfortable Rooms",
      desc: "Choose from single and double rooms, all fully furnished, air-conditioned, and serviced daily.",
    },
    {
      icon: "🍽️",
      title: "Fine Dining",
      desc: "Enjoy fresh meals prepared by our kitchen team — from hearty breakfasts to elegant dinners.",
    },
    {
      icon: "🍹",
      title: "Full-Service Bar",
      desc: "Relax with a wide selection of drinks at our well-stocked bar, open every evening.",
    },
    {
      icon: "📶",
      title: "High-Speed Wi-Fi",
      desc: "Stay connected with complimentary high-speed internet throughout the property.",
    },
    {
      icon: "🧹",
      title: "Daily Housekeeping",
      desc: "Our attentive staff ensures your room is spotless and refreshed each morning.",
    },
    {
      icon: "🔒",
      title: "Secure & Quiet",
      desc: "24-hour security and a tranquil environment so you can rest easy every night.",
    },
  ];
</script>

<svelte:head>
  <title>El'Mariam Hotel — Comfort & Hospitality</title>
</svelte:head>

<!-- Hero -->
<section class="bg-background border-b border-border">
  <div class="max-w-5xl mx-auto px-6 py-24 text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium text-accent rounded-full bg-accent/10">
      <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
      Est. 2008 · Comfort in the heart of the city
    </div>
    <h1 class="text-5xl sm:text-6xl font-bold leading-tight tracking-tight text-foreground">
      A stay you'll<br />
      <span class="text-accent">always remember</span>
    </h1>
    <p class="max-w-2xl mx-auto mt-6 text-lg text-muted-foreground">
      El'Mariam Hotel offers warm hospitality, quality rooms, fine dining,
      and a full-service bar — everything you need for a comfortable and
      memorable stay.
    </p>
    <div class="flex flex-col sm:flex-row justify-center gap-3 mt-8">
      <a
        href="/rooms"
        class="inline-flex items-center justify-center px-6 py-3 font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-xl transition-colors"
      >
        View Rooms
      </a>
      <a
        href="/restaurant"
        class="inline-flex items-center justify-center px-6 py-3 font-medium border border-border text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl transition-colors"
      >
        Our Restaurant
      </a>
    </div>
  </div>
</section>

<!-- Features -->
<section class="bg-card border-b border-border">
  <div class="max-w-5xl mx-auto px-6 py-20">
    <h2 class="text-2xl font-bold text-center text-foreground mb-12">
      Everything you need for a great stay
    </h2>
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each features as f}
        <div class="p-5 bg-background border border-border rounded-xl">
          <div class="mb-3 text-2xl">{f.icon}</div>
          <h3 class="mb-1 font-semibold text-foreground">{f.title}</h3>
          <p class="text-sm text-muted-foreground">{f.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- About / CTA -->
<section class="max-w-5xl mx-auto px-6 py-20">
  <div class="grid md:grid-cols-2 gap-12 items-center">
    <div>
      <div class="mb-3 text-xs font-semibold tracking-widest text-accent uppercase">
        About Us
      </div>
      <h2 class="text-3xl font-bold text-foreground mb-4">
        Hospitality that feels like home
      </h2>
      <p class="text-muted-foreground mb-6">
        For over a decade, El'Mariam Hotel has been the preferred destination
        for travellers seeking comfort without compromise. Our team is
        dedicated to making every stay personal, peaceful, and memorable.
      </p>
      <ul class="space-y-2 text-sm text-muted-foreground">
        <li class="flex items-center gap-2">
          <span class="text-accent">✓</span> Room service available daily
        </li>
        <li class="flex items-center gap-2">
          <span class="text-accent">✓</span> On-site restaurant &amp; bar
        </li>
        <li class="flex items-center gap-2">
          <span class="text-accent">✓</span> Easy online booking &amp; management
        </li>
        <li class="flex items-center gap-2">
          <span class="text-accent">✓</span> Flexible check-in &amp; check-out
        </li>
      </ul>
    </div>

    <!-- Info card -->
    <div class="overflow-hidden border rounded-xl bg-card border-border">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
        <span class="w-3 h-3 bg-destructive rounded-full opacity-60"></span>
        <span class="w-3 h-3 bg-yellow-500 rounded-full opacity-60"></span>
        <span class="w-3 h-3 bg-green-500 rounded-full opacity-60"></span>
        <span class="ml-2 text-xs text-muted-foreground">Quick facts</span>
      </div>
      <div class="p-4 font-mono text-sm text-muted-foreground leading-relaxed space-y-1">
        <p><span class="text-accent">$</span> check-in: 12:00 noon</p>
        <p><span class="text-accent">$</span> check-out: 10:00 am</p>
        <p><span class="text-accent">$</span> bar-hours: 5 pm – midnight</p>
        <p><span class="text-accent">$</span> restaurant: 7 am – 10 pm</p>
        <p><span class="text-accent">$</span> wi-fi: complimentary</p>
        <p><span class="text-accent">$</span> parking: available on-site</p>
      </div>
    </div>
  </div>
</section>

<!-- Bottom CTA -->
<section class="bg-card border-t border-border">
  <div class="max-w-5xl mx-auto px-6 py-16 text-center">
    <h2 class="text-2xl font-bold text-foreground mb-3">Ready to book your stay?</h2>
    <p class="text-muted-foreground mb-6">
      Create an account or sign in to check availability and make a reservation.
    </p>
    <div class="flex flex-col sm:flex-row justify-center gap-3">
      <a
        href="/register"
        class="inline-flex items-center justify-center px-6 py-3 font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-xl transition-colors"
      >
        Book Now — it's free
      </a>
      <a
        href="/login"
        class="inline-flex items-center justify-center px-6 py-3 font-medium border border-border text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl transition-colors"
      >
        Sign In
      </a>
    </div>
  </div>
</section>
