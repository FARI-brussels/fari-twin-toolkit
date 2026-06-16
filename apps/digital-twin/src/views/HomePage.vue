<template>
  <div 
    class="min-h-screen bg-slate-950 text-white overflow-hidden"
    >
    <section class="relative min-h-screen flex items-center">
      <!-- <div class="absolute inset-0">
        <img 
          :src="bxlScreenshot" 
          alt="Brussels Digital Twin" 
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/50" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />
      </div> -->

      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div class="absolute bottom-1/4 right-1/3 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div class="max-w-2xl">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm font-medium mb-8">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            FARI Digital Twin
          </div>

          <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            <span class="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Discover the city
            </span>
            <br />
            <span class="bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              like never before
            </span>
          </h1>

          <p class="text-lg md:text-xl text-slate-300 leading-relaxed mb-10 max-w-xl">
            Experience Brussels in real-time: live transport feeds, air quality data, and urban dynamics — all in an immersive 3D digital twin that reflects the city's heartbeat.
          </p>

          <div class="flex flex-col sm:flex-row gap-4">
            <Button
              as-child
              size="lg"
              variant="gradient"
              class="rounded-xl text-base px-8 transition-all duration-300"
            >
              <RouterLink to="/register" class="flex items-center gap-2">
                Get Started
                <ArrowRight class="w-4 h-4" />
              </RouterLink>
            </Button>
            <Button 
              as-child 
              size="lg" 
              variant="outline" 
              class="rounded-xl border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white text-base px-8"
            >
              <RouterLink to="/library" class="flex items-center gap-2">
                <Layers class="w-4 h-4" />
                Explore Library
              </RouterLink>
            </Button>
          </div>
        </div>
      </div>

      <div class="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
        <span class="text-xs font-medium">Scroll to explore</span>
        <ChevronDown class="w-5 h-5" />
      </div>
    </section>

    <section class="relative py-32 bg-gradient-to-b from-slate-950 to-slate-900">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="text-center mb-20">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">
            <span class="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Everything you need to build
            </span>
          </h2>
          <p class="text-slate-400 text-lg max-w-2xl mx-auto">
            Access a complete toolkit for creating immersive urban visualizations and data-driven applications
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <RouterLink
            v-for="feature in features"
            :key="feature.title"
            :to="feature.link"
            class="group block"
          >
            <FCard tone="glass" interactive class="h-full">
              <div
                class="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                :class="feature.iconBg"
              >
                <component :is="feature.icon" class="w-7 h-7 text-white" />
              </div>

              <h3 class="text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                {{ feature.title }}
              </h3>
              <p class="text-slate-300 text-sm leading-relaxed">
                {{ feature.description }}
              </p>

              <!-- Arrow -->
              <div class="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight class="w-5 h-5 text-primary" />
              </div>
            </FCard>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="relative py-32 bg-gradient-to-b from-slate-900 to-slate-950">
      <div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-5xl font-bold mb-6">
          <span class="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Ready to explore Brussels
          </span>
          <br />
          <span class="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            in a new dimension?
          </span>
        </h2>
        <p class="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
          Start building with our comprehensive API and discover the power of urban digital twins.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            as-child 
            size="lg" 
            class="rounded-xl bg-gradient-to-r from-primary to-emerald-500 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 text-base px-8"
          >
            <RouterLink to="/register">
              Create Free Account
            </RouterLink>
          </Button>
          <Button 
            as-child 
            size="lg" 
            variant="outline" 
            class="rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white text-base px-8"
          >
            <RouterLink to="/doc">
              View Documentation
            </RouterLink>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { FCard } from '@fari-brussels/twin-ui-vue';
import { ArrowRight, ArrowUpRight, ChevronDown, Box, Map, Layers, Radio } from 'lucide-vue-next';

const features = [
  {
    title: '3D Assets',
    description: 'Upload and manage 3D models with automatic optimization and streaming support.',
    icon: Box,
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    link: '/library/assets',
  },
  {
    title: 'Map Layers',
    description: 'Integrate WMS and tile layers from multiple providers with ease.',
    icon: Map,
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    link: '/library/maps',
  },
  {
    title: '3D Tilesets',
    description: 'Stream massive 3D datasets with automatic level-of-detail management.',
    icon: Layers,
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    link: '/library/tilesets',
  },
  {
    title: 'Realtime Data',
    description: 'Connect to live feeds for transport, environment, and urban events.',
    icon: Radio,
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    link: '/library/realtime',
  },
];

</script>