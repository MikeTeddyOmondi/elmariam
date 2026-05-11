<div class="hero">
  <div class="hero-content">
    <h1>Welcome to El'Mariam Hotel</h1>
    <p>Experience comfort and hospitality in the heart of the city.</p>
    <div class="ctas">
      <a href="/rooms" class="btn-primary">View Rooms</a>
      <a href="/restaurant" class="btn-secondary">Our Restaurant</a>
    </div>
  </div>
</div>

<section class="features">
  <div class="grid">
    <div class="card">
      <h3>Comfortable Rooms</h3>
      <p>Choose from single and double rooms, all fully furnished and serviced.</p>
    </div>
    <div class="card">
      <h3>Fine Dining</h3>
      <p>Enjoy fresh meals prepared by our kitchen team, from appetizers to desserts.</p>
    </div>
    <div class="card">
      <h3>Full-Service Bar</h3>
      <p>Relax with a wide selection of drinks at our well-stocked bar.</p>
    </div>
  </div>
</section>

<style>
  .hero {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
    color: #fff;
    padding: 6rem 2rem;
    text-align: center;
  }
  .hero-content { max-width: 600px; margin: 0 auto; }
  h1 { font-size: 2.5rem; margin: 0 0 1rem; }
  p { font-size: 1.1rem; color: #ccc; margin: 0 0 2rem; }
  .ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .btn-primary { background: #c0392b; color: #fff; padding: 0.75rem 1.75rem; border-radius: 4px; text-decoration: none; font-weight: 600; }
  .btn-secondary { background: transparent; color: #fff; border: 2px solid #fff; padding: 0.75rem 1.75rem; border-radius: 4px; text-decoration: none; font-weight: 600; }
  .features { padding: 4rem 2rem; background: #f9f9f9; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; max-width: 1100px; margin: 0 auto; }
  .card { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .card h3 { margin: 0 0 0.75rem; color: #1a1a2e; }
  .card p { margin: 0; color: #666; line-height: 1.6; }
</style>
