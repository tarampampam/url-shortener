<script lang="ts">
  const { url }: { url: string } = $props()

  const copy = async () => navigator.clipboard.writeText(url)
</script>

<section class="hidden" id="result">
  <a href={url} target="_blank" rel="noopener noreferrer">{url.replace(/^(https?:\/\/)/, '')}</a>
  <button class="copy" onclick={copy}>Copy link</button>
</section>

<style>
  section#result {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 1em;
    align-items: center;
    color: var(--color-success-text);
    background: var(--color-success-bg);
    border: 0.1em solid var(--color-success-border);
    box-shadow: 0 0 1em -0.3em var(--color-success-border);
    padding: 1em 1.5em;
    border-radius: 0.35em;

    a {
      position: relative;
      color: var(--color-success-text);
      text-shadow: 0 0 0.4em var(--color-success-text-inversed);
      font-family: monospace;
      letter-spacing: -0.08em;
      font-weight: bolder;
      text-decoration: none;

      &::before {
        content: '';
        position: absolute;
        display: block;
        width: 100%;
        height: 0.09em;
        bottom: 0;
        left: 0;
        background-color: var(--color-success-text);
        transform: scaleX(0);
        filter: opacity(0);
        transition:
          transform 0.3s ease,
          filter 0.4s ease;
      }

      &:hover::before {
        transform: scaleX(1);
        filter: opacity(0.7);
      }
    }

    button.copy {
      background-color: var(--color-success-bg-inversed);
      border: 0.1em solid var(--color-success-border);
      color: var(--color-success-text);
      border-radius: 0.3em;
      padding: 0.35em 1em;
      opacity: 0.9;
      cursor: pointer;
      transition: opacity 0.2s ease;
      user-select: none;

      &:hover {
        opacity: 1;
      }

      &:active {
        transform: translateY(0.03em);
      }
    }
  }
</style>
