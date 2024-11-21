<script>
// @ts-nocheck

  export let searchTerm;
  // console.log(searchTerm);

  let val = "";
  let timer;

  const debounce = (v) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      val = v;
    }, 750);
  };
</script>

<!-- <form class="form my-2">
  <input
    class="form-control w-100"
    type="search"
    placeholder="Search for drinks"
    aria-label="Search"
  />
  <button class="btn btn-outline-primary my-2 w-100 p-2" type="submit">
    Search
  </button>
</form> -->

<!-- <form class="d-flex d-sm-inline-block form-inline ml-md-3 my-2 my-md-0 mw-100"> -->
<form class="d-flex my-2">
  <div class="input-group">
    <input
      type="text"
      class="form-control bg-light border-1 small"
      placeholder="Search for drinks"
      aria-label="Search"
      aria-describedby="basic-addon2"
      on:keyup={({ target: { value } }) => debounce(value)}
    />
    <div class="input-group-append">
      <button class="btn btn-primary" type="button">
        <i class="fas fa-search fa-sm" />
      </button>
    </div>
  </div>
</form>
