import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'

// Mock Vercel Speed Insights
vi.mock('@vercel/speed-insights/vue', () => ({
  SpeedInsights: {
    name: 'SpeedInsights',
    template: '<div></div>',
  },
}))

describe('App', () => {
  it('renders without crashing', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          component: { template: '<div>Home</div>' },
        },
      ],
    })

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.relative.min-h-screen').exists()).toBe(true)
  })
})
