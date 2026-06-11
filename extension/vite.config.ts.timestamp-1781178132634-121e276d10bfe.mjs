// vite.config.ts
import { defineConfig } from "file:///C:/Users/anshr/Desktop/project/flowpilot-ai/extension/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/anshr/Desktop/project/flowpilot-ai/extension/node_modules/@vitejs/plugin-react/dist/index.js";
import { crx } from "file:///C:/Users/anshr/Desktop/project/flowpilot-ai/extension/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "Orvicc",
  version: "1.0.0",
  description: "AI-powered browser automation agent that understands natural language and executes repetitive workflows",
  permissions: [
    "activeTab",
    "scripting",
    "storage",
    "tabs",
    "downloads"
  ],
  host_permissions: [
    "<all_urls>"
  ],
  externally_connectable: {
    matches: [
      "*://localhost/*",
      "https://Orvicc.ai/*",
      "https://*.Orvicc.ai/*",
      "https://frontend-gules-six-c66710xx78.vercel.app/*"
    ]
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content-scripts/index.ts"],
      run_at: "document_idle"
    }
  ],
  action: {
    default_popup: "index.html",
    default_icon: {
      "16": "public/icon16.png",
      "48": "public/icon48.png",
      "128": "public/icon128.png"
    }
  },
  icons: {
    "16": "public/icon16.png",
    "48": "public/icon48.png",
    "128": "public/icon128.png"
  },
  web_accessible_resources: [
    {
      resources: ["src/content-scripts/*"],
      matches: ["<all_urls>"]
    }
  ]
};

// vite.config.ts
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\anshr\\Desktop\\project\\flowpilot-ai\\extension";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest_default })
  ],
  resolve: {
    alias: {
      "@shared": path.resolve(__vite_injected_original_dirname, "../../shared")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Give the content script a stable, predictable filename
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === "index.ts" && chunkInfo.facadeModuleId?.includes("content-scripts")) {
            return "assets/content-script.js";
          }
          return "assets/[name]-[hash].js";
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAibWFuaWZlc3QuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFuc2hyXFxcXERlc2t0b3BcXFxccHJvamVjdFxcXFxmbG93cGlsb3QtYWlcXFxcZXh0ZW5zaW9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhbnNoclxcXFxEZXNrdG9wXFxcXHByb2plY3RcXFxcZmxvd3BpbG90LWFpXFxcXGV4dGVuc2lvblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYW5zaHIvRGVza3RvcC9wcm9qZWN0L2Zsb3dwaWxvdC1haS9leHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBjcnggfSBmcm9tICdAY3J4anMvdml0ZS1wbHVnaW4nO1xuaW1wb3J0IG1hbmlmZXN0IGZyb20gJy4vbWFuaWZlc3QuanNvbic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgY3J4KHsgbWFuaWZlc3QgfSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0BzaGFyZWQnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vc2hhcmVkJyksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgLy8gR2l2ZSB0aGUgY29udGVudCBzY3JpcHQgYSBzdGFibGUsIHByZWRpY3RhYmxlIGZpbGVuYW1lXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XG4gICAgICAgICAgaWYgKGNodW5rSW5mby5uYW1lID09PSAnaW5kZXgudHMnICYmIGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZD8uaW5jbHVkZXMoJ2NvbnRlbnQtc2NyaXB0cycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9jb250ZW50LXNjcmlwdC5qcyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iLCAie1xuICBcIm1hbmlmZXN0X3ZlcnNpb25cIjogMyxcbiAgXCJuYW1lXCI6IFwiT3J2aWNjXCIsXG4gIFwidmVyc2lvblwiOiBcIjEuMC4wXCIsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJBSS1wb3dlcmVkIGJyb3dzZXIgYXV0b21hdGlvbiBhZ2VudCB0aGF0IHVuZGVyc3RhbmRzIG5hdHVyYWwgbGFuZ3VhZ2UgYW5kIGV4ZWN1dGVzIHJlcGV0aXRpdmUgd29ya2Zsb3dzXCIsXG4gIFwicGVybWlzc2lvbnNcIjogW1xuICAgIFwiYWN0aXZlVGFiXCIsXG4gICAgXCJzY3JpcHRpbmdcIixcbiAgICBcInN0b3JhZ2VcIixcbiAgICBcInRhYnNcIixcbiAgICBcImRvd25sb2Fkc1wiXG4gIF0sXG4gIFwiaG9zdF9wZXJtaXNzaW9uc1wiOiBbXG4gICAgXCI8YWxsX3VybHM+XCJcbiAgXSxcbiAgXCJleHRlcm5hbGx5X2Nvbm5lY3RhYmxlXCI6IHtcbiAgICBcIm1hdGNoZXNcIjogW1xuICAgICAgXCIqOi8vbG9jYWxob3N0LypcIixcbiAgICAgIFwiaHR0cHM6Ly9PcnZpY2MuYWkvKlwiLFxuICAgICAgXCJodHRwczovLyouT3J2aWNjLmFpLypcIixcbiAgICAgIFwiaHR0cHM6Ly9mcm9udGVuZC1ndWxlcy1zaXgtYzY2NzEweHg3OC52ZXJjZWwuYXBwLypcIlxuICAgIF1cbiAgfSxcbiAgXCJiYWNrZ3JvdW5kXCI6IHtcbiAgICBcInNlcnZpY2Vfd29ya2VyXCI6IFwic3JjL2JhY2tncm91bmQvaW5kZXgudHNcIixcbiAgICBcInR5cGVcIjogXCJtb2R1bGVcIlxuICB9LFxuICBcImNvbnRlbnRfc2NyaXB0c1wiOiBbXG4gICAge1xuICAgICAgXCJtYXRjaGVzXCI6IFtcIjxhbGxfdXJscz5cIl0sXG4gICAgICBcImpzXCI6IFtcInNyYy9jb250ZW50LXNjcmlwdHMvaW5kZXgudHNcIl0sXG4gICAgICBcInJ1bl9hdFwiOiBcImRvY3VtZW50X2lkbGVcIlxuICAgIH1cbiAgXSxcbiAgXCJhY3Rpb25cIjoge1xuICAgIFwiZGVmYXVsdF9wb3B1cFwiOiBcImluZGV4Lmh0bWxcIixcbiAgICBcImRlZmF1bHRfaWNvblwiOiB7XG4gICAgICBcIjE2XCI6IFwicHVibGljL2ljb24xNi5wbmdcIixcbiAgICAgIFwiNDhcIjogXCJwdWJsaWMvaWNvbjQ4LnBuZ1wiLFxuICAgICAgXCIxMjhcIjogXCJwdWJsaWMvaWNvbjEyOC5wbmdcIlxuICAgIH1cbiAgfSxcbiAgXCJpY29uc1wiOiB7XG4gICAgXCIxNlwiOiBcInB1YmxpYy9pY29uMTYucG5nXCIsXG4gICAgXCI0OFwiOiBcInB1YmxpYy9pY29uNDgucG5nXCIsXG4gICAgXCIxMjhcIjogXCJwdWJsaWMvaWNvbjEyOC5wbmdcIlxuICB9LFxuICBcIndlYl9hY2Nlc3NpYmxlX3Jlc291cmNlc1wiOiBbXG4gICAge1xuICAgICAgXCJyZXNvdXJjZXNcIjogW1wic3JjL2NvbnRlbnQtc2NyaXB0cy8qXCJdLFxuICAgICAgXCJtYXRjaGVzXCI6IFtcIjxhbGxfdXJscz5cIl1cbiAgICB9XG4gIF1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1YsU0FBUyxvQkFBb0I7QUFDNVgsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsV0FBVzs7O0FDRnBCO0FBQUEsRUFDRSxrQkFBb0I7QUFBQSxFQUNwQixNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsRUFDWCxhQUFlO0FBQUEsRUFDZixhQUFlO0FBQUEsSUFDYjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQUEsRUFDQSxrQkFBb0I7QUFBQSxJQUNsQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLHdCQUEwQjtBQUFBLElBQ3hCLFNBQVc7QUFBQSxNQUNUO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFlBQWM7QUFBQSxJQUNaLGdCQUFrQjtBQUFBLElBQ2xCLE1BQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxpQkFBbUI7QUFBQSxJQUNqQjtBQUFBLE1BQ0UsU0FBVyxDQUFDLFlBQVk7QUFBQSxNQUN4QixJQUFNLENBQUMsOEJBQThCO0FBQUEsTUFDckMsUUFBVTtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFVO0FBQUEsSUFDUixlQUFpQjtBQUFBLElBQ2pCLGNBQWdCO0FBQUEsTUFDZCxNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSwwQkFBNEI7QUFBQSxJQUMxQjtBQUFBLE1BQ0UsV0FBYSxDQUFDLHVCQUF1QjtBQUFBLE1BQ3JDLFNBQVcsQ0FBQyxZQUFZO0FBQUEsSUFDMUI7QUFBQSxFQUNGO0FBQ0Y7OztBRGpEQSxPQUFPLFVBQVU7QUFKakIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sSUFBSSxFQUFFLDJCQUFTLENBQUM7QUFBQSxFQUNsQjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsV0FBVyxLQUFLLFFBQVEsa0NBQVcsY0FBYztBQUFBLElBQ25EO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBO0FBQUEsUUFFTixnQkFBZ0IsQ0FBQyxjQUFjO0FBQzdCLGNBQUksVUFBVSxTQUFTLGNBQWMsVUFBVSxnQkFBZ0IsU0FBUyxpQkFBaUIsR0FBRztBQUMxRixtQkFBTztBQUFBLFVBQ1Q7QUFDQSxpQkFBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
