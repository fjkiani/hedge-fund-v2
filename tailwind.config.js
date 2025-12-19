/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background Layers
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#12121a',
        'bg-tertiary': '#1a1a25',
        'bg-hover': '#22222f',
        
        // Accent Colors
        'accent-green': '#00ff88',
        'accent-red': '#ff3366',
        'accent-blue': '#00d4ff',
        'accent-purple': '#a855f7',
        'accent-orange': '#ff9500',
        'accent-gold': '#ffd700',
        
        // Text
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0b0',
        'text-muted': '#606070',
        
        // Borders
        'border-subtle': '#2a2a35',
        'border-active': '#3a3a45',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
        'sans': ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        'display': ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-red': '0 0 20px rgba(255, 51, 102, 0.3)',
        'glow-blue': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
      },
    },
  },
  plugins: [],
}
