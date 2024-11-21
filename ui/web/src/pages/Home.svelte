<script>
  // import { onMount } from "svelte";
  // import { link, push } from "svelte-spa-router";
  // import { axiosInstance } from "../interceptors/axios";
  
  import CheckAvailabilitySection from "../components/CheckAvailabilitySection.svelte";
  import ContactSection from "../components/ContactSection.svelte";
  import InfoSection from "../components/InfoSection.svelte";
  import RecommendationSection from "../components/RecommendationSection.svelte";
  import SubscribeCta from "../components/SubscribeCta.svelte";
  import VideoSection from "../components/VideoSection.svelte";
  import RootLayout from "../layouts/rootLayout.svelte";

</script>

<RootLayout>
  <CheckAvailabilitySection />

  <SubscribeCta />

  <InfoSection />

  <!-- <RecommendationSection />

  <VideoSection /> -->

  <ContactSection />
</RootLayout>
