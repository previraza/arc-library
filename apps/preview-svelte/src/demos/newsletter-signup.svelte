<script lang="ts">
  import NewsletterSignup from "@/registry/blocks/newsletter-signup/newsletter-signup.svelte";
</script>

<div style="width: min(560px, 100%)">
  <NewsletterSignup onSubscribe={() => new Promise((resolve) => setTimeout(resolve, 800))} readers={{ count: 12400, faces: [] }} />
</div>
