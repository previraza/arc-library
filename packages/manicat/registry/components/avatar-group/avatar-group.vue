<script setup lang="ts">
import { computed } from "vue";
import Avatar from "@/registry/components/avatar/avatar.vue";

export interface AvatarGroupMember {
  name: string;
  src?: string;
  status?: "online" | "offline";
}

const props = withDefaults(
  defineProps<{
    members: AvatarGroupMember[];
    /** How many avatars show before the rest collapse into a +N. */
    max?: number;
    size?: "sm" | "md" | "lg";
    label?: string;
    /** Extend the inner, named parts of the group: slot or overflow. */
    classNames?: { slot?: string; overflow?: string };
  }>(),
  { max: 4, size: "md", label: "Team members" },
);

const visible = computed(() => props.members.slice(0, Math.max(0, props.max)));
const overflow = computed(() => Math.max(0, props.members.length - visible.value.length));
</script>

<template>
  <div :class="['mc-avatar-group', `mc-avatar-group--${size}`]" role="group" :aria-label="label">
    <span v-for="member in visible" :key="member.name" :class="['mc-avatar-group__slot', classNames?.slot]">
      <Avatar v-bind="member" :size="size" />
    </span>
    <span v-if="overflow > 0" :class="['mc-avatar-group__slot', 'mc-avatar-group__overflow', classNames?.overflow]" :aria-label="`${overflow} more`">+{{ overflow }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-avatar-group { --mc-size: 36px; display: inline-flex; align-items: center; }
.mc-avatar-group--sm { --mc-size: 28px; } .mc-avatar-group--lg { --mc-size: 48px; }
.mc-avatar-group__slot { display: inline-grid; margin-left: calc(var(--mc-size) / -3); border: 2px solid var(--background); border-radius: 50%; }
.mc-avatar-group__slot:first-child { margin-left: 0; }
.mc-avatar-group__overflow { place-items: center; box-sizing: content-box; width: var(--mc-size); height: var(--mc-size); background: var(--surface-muted); color: var(--text-secondary); font-size: var(--text-xs); font-weight: 500; }
</style>
