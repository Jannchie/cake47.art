export function useAdminToken() {
  return useCookie<string | null>('admin-token', {
    default: () => null,
    sameSite: 'strict',
  })
}

export function useAdminApi() {
  const token = useAdminToken()
  return {
    token,
    async fetch<T>(url: string, options: Record<string, unknown> = {}): Promise<T> {
      const headers = new Headers((options.headers as HeadersInit) ?? {})
      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`)
      }
      return await $fetch<T>(url, { ...options, headers })
    },
  }
}
