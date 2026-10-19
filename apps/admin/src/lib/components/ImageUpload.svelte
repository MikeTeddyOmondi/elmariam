<script lang="ts">
  import { Button, toast, toastError } from '@elmariam/ui';
  import ImageIcon from 'lucide-svelte/icons/image';
  import Upload from 'lucide-svelte/icons/upload';
  import { presignImageUpload, attachImage, type ImageKind } from '$lib/remote/images.remote';

  let {
    kind,
    id,
    imageUrl = $bindable(),
    label = 'Image',
  }: { kind: ImageKind; id: string; imageUrl?: string; label?: string } = $props();

  const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';
  const MAX_BYTES = 5 * 1024 * 1024;

  let uploading = $state(false);
  let fileInput: HTMLInputElement | undefined = $state();

  /**
   * Two-phase upload, as in locci-platform: presign on the server, PUT the
   * bytes straight to storage, then attach. The Content-Type sent here must be
   * the one presigned, because the server signs it into the URL.
   */
  async function upload(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) {
      toast.error('Use a JPEG, PNG, WebP or AVIF image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Images must be 5 MB or smaller.');
      return;
    }

    uploading = true;
    try {
      const { uploadUrl, key } = await presignImageUpload({
        kind,
        id,
        contentType: file.type,
        size: file.size,
      });
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);

      const attached = await attachImage({ kind, id, key, previousUrl: imageUrl });
      imageUrl = attached.imageUrl;
      toast.success('Image updated.');
    } catch (e) {
      toastError(e);
    } finally {
      uploading = false;
      if (fileInput) fileInput.value = '';
    }
  }
</script>

<div class="flex items-center gap-4">
  <div class="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
    {#if imageUrl}
      <img src={imageUrl} alt={label} class="h-full w-full object-cover" />
    {:else}
      <ImageIcon class="size-6 text-muted-foreground" />
    {/if}
  </div>
  <div class="space-y-1">
    <p class="text-sm font-medium text-foreground">{label}</p>
    <input
      bind:this={fileInput}
      type="file"
      accept={ACCEPT}
      class="hidden"
      onchange={(e) => upload(e.currentTarget.files?.[0])}
    />
    <Button type="button" variant="outline" size="sm" disabled={uploading} onclick={() => fileInput?.click()}>
      <Upload />
      {uploading ? 'Uploading…' : imageUrl ? 'Replace image' : 'Upload image'}
    </Button>
    <p class="text-xs text-muted-foreground">JPEG, PNG, WebP or AVIF, up to 5 MB.</p>
  </div>
</div>
