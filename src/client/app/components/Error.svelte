<script lang="ts">
  const { message }: { message: string } = $props()
</script>

<section>{message}</section>

<style>
  section {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    font-size: 0.9em;
    max-width: 30vw;
    min-width: 20em;
    color: var(--color-error-text);
    background-color: var(--color-error-bg);
    border: 0.1em solid var(--color-error-border);
    box-shadow: 0 0 1em -0.3em var(--color-error-border);
    text-shadow: 0 0 0.3em var(--color-error-bg-inversed);
    padding: 1em 1.5em;
    border-radius: 0.2em;
  }
</style>
