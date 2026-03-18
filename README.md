# Mahrom App

Mahrom App is an interactive web application designed to help users visualize their extended family tree and accurately calculate Mahram (family members one is prohibited from marrying according to Islamic jurisprudence) based on their specific relationships.

## Features

- **Interactive Family Tree**: Build your lineage dynamically on a draggable, zoomable canvas.
- **Mahram Calculation Engine**: Automatically determines Mahram status based on:
  - **Nasab (Biological/Blood)**: Parents, siblings, grandparents, aunts, uncles, nieces, nephews.
  - **Musaharah (Marriage/In-laws)**: Parents-in-law, children-in-law, step-parents, step-children.
  - **Rada'ah (Foster/Nursing)**: Foster parents, foster siblings, foster children, and all resulting Musaharah min ar-Rada'ah (marriage prohibitions extending from foster relations).
- **Comprehensive Explanations**: Provides detailed, specific reasoning for why a relative is categorized as *Mahram Selamanya* (Eternal), *Mahram Sementara* (Temporary/Conditional), or *Bukan Mahram* (Non-Mahram).
- **Auto-Spouse & Routing Logic**: Intelligently handles couple formations and draws mathematically accurate T-junctions connecting descendants.
- **Gender-Aware**: Computes the correct rulings dynamically depending on whether the primary user is male or female.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for fast, optimized builds
- **Tailwind CSS** for responsive, modern UI styling
- **Zustand** for lightweight global state management
- **Lucide React** for beautiful iconography
- Built entirely with client-side logic for instant, offline-capable results.

## Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Run the development server:**
   ```bash
   bun run dev
   ```

3. **Build for production:**
   ```bash
   bun run build
   ```

## How to Use

1. **Select Gender**: Start by selecting whether the main node (you) is Male or Female.
2. **Add Relationships**: Click the `+` icon on any existing person to add direct relatives (parents, children, siblings, spouses) or use the search bar at the top to add specific, complex relationships (e.g., "Ibu Susuan Istri").
3. **Analyze**: Click on any person in the tree to view their detailed Mahram status, category, and the specific jurisprudential reason behind the ruling.
4. **Move & Organize**: Drag any profile card around the canvas to organize your family tree exactly how you want it.
