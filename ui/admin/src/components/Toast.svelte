<script>
  export let toastProps;
</script>

{#if toastProps.isErr}
  <div class="row">
    <div class="col-lg-12 mb-1">
      <div
        class="alert alert-danger alert-dismissable text-gray shadow animated--grow-in"
      >
        <button class="close" data-dismiss="alert">&times;</button>
        <b>
          {toastProps.toastMsg}
        </b>
      </div>
    </div>
  </div>
{/if}

{#if toastProps.isSucc}
  <div class="row">
    <div class="col-lg-12 mb-1">
      <div
        class="alert alert-success alert-dismissable text-gray shadow animated--grow-in"
      >
        <button class="close" data-dismiss="alert">&times;</button>
        <b>
          {toastProps.toastMsg}
        </b>
      </div>
    </div>
  </div>
{/if}
