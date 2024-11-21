<script>
  import { addToDrinkCart } from "../stores/barStore";

  export let barDrink;
  // console.log(barDrink);
  const { _id: id, drinkName, drinkCode, imageUrl, inStock } = barDrink;

</script>

<div class="card p-3">
  <!-- svelte-ignore a11y-img-redundant-alt -->
  {#if imageUrl !== ""}
    <img
      class="card-img-top"
      src={imageUrl}
      alt={drinkCode}
      width="240"
      height="300"
    />
  {:else}
    <img
      class="card-img-top"
      src="https://placehold.co/600x400?text=Drink\nImage"
      alt={drinkCode}
    />
  {/if}

  <div class="card-body">
    <h5 class="card-title">{drinkName}</h5>
    <!-- <p class="card-text">Bar drink details.</p> -->
    <button
      class="btn btn-primary align-content-center justify-content-between"
      on:click={() => addToDrinkCart(barDrink)}
      >
      <!-- {inStock ? '' : 'disabled'}" -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-plus-circle-fill"
        viewBox="0 0 16 16"
      >
        <path
          d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"
        />
      </svg>
      <span>Add to Cart</span>
    </button>
  </div>
</div>
