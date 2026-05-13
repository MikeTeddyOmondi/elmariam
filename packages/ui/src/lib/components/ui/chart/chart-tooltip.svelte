<script lang="ts">
  interface Props {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'dot' | 'line' | 'dashed';
    label?: string;
    nameKey?: string;
  }
  let { hideLabel, hideIndicator, indicator, label, nameKey }: Props = $props();
</script>
<!-- Tooltip is rendered natively by the chart library -->
