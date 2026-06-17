<div align="center">
  <img src="./assets/images/icon.png" alt="Loop Logo" width="120" height="120"/>

# Loop 🔄

### AI-Powered Hackathon MatchMaking Platform

  <p><b>Discover. Analyze. Connect.</b></p>

  <p>
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
    <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white"/>
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
    <img src="https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white"/>
  </p>
</div>

---

## 📖 Overview

**Loop** is a high-performance mobile application designed to rethink how users discover and connect with opportunities.

Built using **React Native (Expo)** with a **Supabase backend**, it combines:

- Gesture-based discovery (swipe interface)
- Real-time data sync
- Serverless AI-driven profile generation

This is not just a UI project — it demonstrates **scalable architecture, real-time systems, and edge computing integration**.

---

## 🚀 Demo

- 📱 APK: https://github.com/igdevansh09/Loop/releases/download/apps/Loop.apk
- 🎥 Demo Video: https://youtube.com/shorts/17AIQpRHrjc?si=t6pLO01wU0ib4SO1

---

## ✨ Technical Highlights

### ⚡ Edge Functions

- `analyze-signal` → processes user interactions
- `generate-profile` → builds AI-enhanced profiles
- Runs on Supabase Edge (Deno)

### 🧠 State Management

- Zustand modular stores:
  - `useAuthStore`
  - `useArenaStore`
  - `useLedgerStore`
  - `useLaunchStore`

### 🎯 UI/UX

- Tinder-style swipe system
- Built with Reanimated + Gesture Handler
- Smooth, native performance

### 🔄 Real-Time

- Supabase subscriptions for:
  - Inbound requests
  - Outbound actions
  - Notifications

---

## 🛠️ Tech Stack

### Frontend

- React Native (Expo)
- Expo Router
- TypeScript
- Zustand
- Reanimated + Gesture Handler

### Backend

- Supabase (PostgreSQL + RLS)
- Supabase Auth
- Edge Functions (Deno)
- Real-time subscriptions

---

## 📱 Core Features

### 🏟 Arena

- Swipe-based discovery
- Adaptive matching via interaction signals

### 📥📤 Ledger

- Track inbound & outbound connections
- Detailed profile analytics (Dossier view)

### ⚙️ Command Center

- AI-generated profiles
- Account & system control

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / yarn
- Expo CLI
- Supabase CLI (optional)

---

### 1. Clone

```bash
git clone https://github.com/igdevansh09/loop.git
cd loop
```

### 2\. Install dependencies

Bash

```
npm install

```

### 3\. Environment Setup

Create a `.env` file in the root directory with your Supabase credentials:

Code snippet

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

```

### 4\. Deploy Edge Functions (Optional)

Bash

```
supabase functions deploy analyze-signal
supabase functions deploy generate-profile
supabase functions deploy push-notification

```

### 5\. Run the App

Bash

```
npx expo start

```

Scan the QR code with the Expo Go app on your physical device, or press `a` to run on an Android emulator / `i` for iOS simulator.

---

## 🗂️ Project Structure

Plaintext

```
loop/
├── src/
│   │   ├── (auth)/           # Authentication screens
│   ���── app/              # Expo Router navigation
│   │   ├── (drawer)/         # Sidebar & main application shell
│   │   │   ├── (tabs)/       # Tabbed navigation (Arena, Inbound, Profile)
│   │   │   └── command-center.tsx # Mission & capacity management
│   │   │   └── outbound.tsx  # For outbound requests
│   │   │   └── create.tsx    # For project creation
│   │   ├── dossier.tsx       # Detailed profile view (Modal)
│   │   ├── onboarding.tsx    # User initialization flow
│   │   └── index.tsx         # App entry point
│   ├── components/           # Reusable UI (SwiperCard, InboundCard, Dossier)
│   ├── constants/            # Theming and app constants
│   ├── lib/                  # Core libraries (Supabase client init)
│   └── store/                # Zustand global state slices
├── supabase/
│   ├── functions/            # Deno Edge Functions
│   │   ├── analyze-signal/
│   │   ├── generate-profile/
│   │   └── push-notification/
└── assets/                   # Images, fonts, and icons

```

---

<div align="center">

<i>Developed with ❤️ by <a href="https://www.google.com/search?q=https://github.com/igdevansh09">Devansh Gupta</a></i>

</div>
