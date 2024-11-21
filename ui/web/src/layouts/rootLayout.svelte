<script>


  import CheckAvailabilitySection from "../components/CheckAvailabilitySection.svelte";
  import ContactSection from "../components/ContactSection.svelte";
  import Footer from "../components/Footer.svelte";
  import InfoSection from "../components/InfoSection.svelte";
  import Navbar from "../components/Navbar.svelte";
  import RecommendationSection from "../components/RecommendationSection.svelte";
  import SubscribeCta from "../components/SubscribeCta.svelte";
  import VideoSection from "../components/VideoSection.svelte";
</script>

<svelte:head>
  <title>Hotel El' Mariam</title>
</svelte:head>

<div class="tm-main-content" id="top">
  <div class="tm-top-bar-bg"></div>
  <div class="tm-top-bar" id="tm-top-bar">
    <!-- Top Navbar -->
    <Navbar />
  </div>

  <slot />

  <Footer />
</div>
