<script setup lang="ts">
import {
  AppShell,
  Btn,
  Paper,
} from '@roku-ui/vue'
import { ref } from 'vue'

const activeTab = ref('dashboard')

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: 'tabler:dashboard' },
  { id: 'users', name: 'Users', icon: 'tabler:users' },
  { id: 'content', name: 'Content', icon: 'tabler:file-text' },
  { id: 'analytics', name: 'Analytics', icon: 'tabler:chart-line' },
]

definePageMeta({
  layout: false,
})
</script>

<template>
  <AppShell
    header-height="60px"
    footer-height="40px"
    navbar-width="200px"
    aside-width="160px"
    padding="8px"
    gap="8px"
  >
    <template #header>
      <div class="h-16 flex items-center justify-between border-b bg-white px-6">
        <h1 class="text-xl text-gray-900 font-bold">
          Admin Dashboard
        </h1>
        <Btn variant="outline" size="sm">
          <Icon name="tabler:settings" class="mr-2" size="16" />
          Settings
        </Btn>
      </div>
    </template>

    <template #sidebar>
      <div class="h-full w-64 border-r bg-white shadow-sm">
        <nav class="p-4">
          <div class="space-y-2">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors" :class="[
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50',
              ]"
              @click="activeTab = tab.id"
            >
              <Icon :name="tab.icon" class="mr-3 inline" size="16" />
              {{ tab.name }}
            </button>
          </div>
        </nav>
      </div>
    </template>

    <template #main>
      <div class="p-6">
        <div v-if="activeTab === 'dashboard'">
          <h2 class="mb-6 text-2xl text-gray-900 font-bold">
            Dashboard Overview
          </h2>
          <div class="grid grid-cols-1 mb-8 gap-6 md:grid-cols-3">
            <Paper class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">
                    Total Users
                  </p>
                  <p class="text-2xl text-gray-900 font-bold">
                    1,234
                  </p>
                  <p class="text-sm text-green-600">
                    +12% from last month
                  </p>
                </div>
                <Icon name="tabler:users" size="24" class="text-gray-400" />
              </div>
            </Paper>

            <Paper class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">
                    Page Views
                  </p>
                  <p class="text-2xl text-gray-900 font-bold">
                    45,678
                  </p>
                  <p class="text-sm text-green-600">
                    +8% from last month
                  </p>
                </div>
                <Icon name="tabler:eye" size="24" class="text-gray-400" />
              </div>
            </Paper>

            <Paper class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">
                    Revenue
                  </p>
                  <p class="text-2xl text-gray-900 font-bold">
                    $12,345
                  </p>
                  <p class="text-sm text-red-600">
                    -2% from last month
                  </p>
                </div>
                <Icon name="tabler:currency-dollar" size="24" class="text-gray-400" />
              </div>
            </Paper>
          </div>

          <Paper class="p-6">
            <h3 class="mb-4 text-lg font-semibold">
              Recent Activity
            </h3>
            <div class="space-y-3">
              <div class="flex items-center space-x-3">
                <div class="h-2 w-2 rounded-full bg-blue-500" />
                <span class="text-sm">New user registration: john@example.com</span>
                <span class="text-xs text-gray-500">2 minutes ago</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="h-2 w-2 rounded-full bg-green-500" />
                <span class="text-sm">Content published: "Getting Started Guide"</span>
                <span class="text-xs text-gray-500">5 minutes ago</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="h-2 w-2 rounded-full bg-yellow-500" />
                <span class="text-sm">System backup completed</span>
                <span class="text-xs text-gray-500">1 hour ago</span>
              </div>
            </div>
          </Paper>
        </div>

        <div v-else-if="activeTab === 'users'">
          <h2 class="mb-6 text-2xl text-gray-900 font-bold">
            User Management
          </h2>
          <Paper class="p-6">
            <p class="text-gray-600">
              User management features will be implemented here.
            </p>
          </Paper>
        </div>

        <div v-else-if="activeTab === 'content'">
          <h2 class="mb-6 text-2xl text-gray-900 font-bold">
            Content Management
          </h2>
          <Paper class="p-6">
            <p class="text-gray-600">
              Content management features will be implemented here.
            </p>
          </Paper>
        </div>

        <div v-else-if="activeTab === 'analytics'">
          <h2 class="mb-6 text-2xl text-gray-900 font-bold">
            Analytics
          </h2>
          <Paper class="p-6">
            <p class="text-gray-600">
              Analytics dashboard will be implemented here.
            </p>
          </Paper>
        </div>
      </div>
    </template>
  </AppShell>
</template>
