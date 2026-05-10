<script setup lang="ts">
const accent = '#8a1827'
</script>

<template>
  <div
    :style="{
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      backgroundColor: '#f8f7f7',
      fontFamily: 'Noto Serif, Noto Serif SC, Noto Serif JP, serif',
      color: '#16181f',
    }"
  >
    <div
      :style="{
        position: 'absolute',
        top: '72px',
        left: '80px',
        right: '80px',
        bottom: '72px',
        border: `1px solid rgba(22,24,31,0.18)`,
        display: 'flex',
      }"
    />

    <div
      :style="{
        position: 'absolute',
        top: '60px',
        left: '64px',
        width: '24px',
        height: '24px',
        borderTop: `2px solid ${accent}`,
        borderLeft: `2px solid ${accent}`,
      }"
    />
    <div
      :style="{
        position: 'absolute',
        bottom: '60px',
        right: '64px',
        width: '24px',
        height: '24px',
        borderBottom: `2px solid ${accent}`,
        borderRight: `2px solid ${accent}`,
      }"
    />

    <div
      :style="{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '120px 128px',
        width: '100%',
        height: '100%',
        gap: '32px',
      }"
    >
      <div
        :style="{
          display: 'flex',
          alignItems: 'baseline',
          fontSize: '128px',
          lineHeight: 1,
          fontWeight: 700,
          letterSpacing: '0.005em',
          color: '#16181f',
        }"
      >
        <span :style="{ display: 'flex' }">snowcake</span>
        <span :style="{ display: 'flex', color: accent }">47</span>
      </div>

      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }"
      >
        <span
          :style="{
            width: '48px',
            height: '1px',
            backgroundColor: accent,
            display: 'block',
          }"
        />
        <span
          :style="{
            fontSize: '32px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: '#2c3140',
            display: 'flex',
            textTransform: 'lowercase',
          }"
        >
          cake47.art
        </span>
        <span
          :style="{
            width: '48px',
            height: '1px',
            backgroundColor: accent,
            display: 'block',
          }"
        />
      </div>

      <div
        :style="{
          fontSize: '30px',
          letterSpacing: '0.2em',
          color: '#6c7384',
          display: 'flex',
        }"
      >
        私期的画室
      </div>
    </div>
  </div>
</template>
