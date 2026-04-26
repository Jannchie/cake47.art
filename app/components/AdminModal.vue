<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  size?: 'default' | 'wide' | 'picker'
  title?: string
}>(), {
  size: 'default',
  title: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const modalClass = computed(() => ({
  'modal-wide': props.size === 'wide',
  'modal-picker': props.size === 'picker',
}))

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) {
    event.preventDefault()
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Transition name="fade">
    <div v-if="modelValue" class="modal-shade" @click.self="close">
      <div class="modal" :class="modalClass" role="dialog" aria-modal="true">
        <header class="modal-head">
          <h3 v-if="title || $slots.title">
            <slot name="title">
              {{ title }}
            </slot>
          </h3>
          <button type="button" class="icon-btn" aria-label="关闭" @click="close">
            <Icon name="lucide:x" />
          </button>
        </header>
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal.modal-wide {
  width: min(960px, 92vw);
}

.modal.modal-picker {
  box-sizing: border-box;
  width: min(1200px, 96vw);
  height: min(860px, calc(100vh - 4rem));
  max-height: calc(100vh - 4rem);
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
}
</style>
