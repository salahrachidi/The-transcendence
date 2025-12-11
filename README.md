<div align="center">
  <h1>The Transcendence</h1>
  <h3>The Ultimate Ping Pong Platform 🏓</h3>
</div>

![Poster](/uploads/Poster.png)

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-Backend-000000?logo=fastify&logoColor=white)
![Vault](https://img.shields.io/badge/Vault-Secured-black?logo=vault&logoColor=white)
![Testing](https://img.shields.io/badge/Tests-Passing-green)

> **"Not just a game. A lesson in secure, scalable, real-time architecture."**

## 🚀 Overview
**ft_transcendence** is a feature-rich, real-time multiplayer Pong platform. But under the hood, it's a showcase of modern DevOps and Secure Software Development Life Cycle (SSDLC) practices.

Built with a microservices-inspired architecture, it leverages **Next.js** for a responsive frontend, **Fastify** for a high-performance backend, and **HashiCorp Vault** for enterprise-grade secret management. This isn't just a coding exercise; it's a simulation of a production-ready environment.

---

## ✨ Key Features & "The Why"
_Why this stack? Because performance and security matter._

- **🛡️ Enterprise Security (Vault):** Unlike typical student projects that store secrets in `.env` files, this project uses **HashiCorp Vault** to manage secrets dynamically. This mimics real-world banking and enterprise security standards.
- **⚡ Real-Time Performance:** Utilizes WebSockets for low-latency gameplay, ensuring a smooth competitive experience.
- **🐋 Containerized Infrastructure:** Fully Dockerized environment ensuring consistency from development to production. `make up` is all you need.
- **🔐 Two-Factor Authentication (2FA):** Implements industry-standard TOTP 2FA for robust user account security.
- **📊 Interactive Dashboard:** dynamic visualizations of user stats and match history.

---

## 🏗️ Architecture

This project follows a separation of concerns principle, dividing the application into distinct, containerized services:

```mermaid
graph TD
    User[User] -->|HTTPS/WSS| Nginx[Nginx WAF & Load Balancer]
    Nginx -->|Traffic| Frontend[Next.js Frontend]
    Nginx -->|API Req| Backend[Fastify Backend]
    Backend -->|Read/Write| DB[(Database)]
    Backend -->|Auth| Vault[HashiCorp Vault]
    Backend -->|Metrics| Prom[Prometheus Monitor]
```

### Tech Stack
| Component | Technology | Reasoning |
|-----------|------------|-----------|
| **Frontend** | Next.js 15, Framer Motion | SSR for SEO and performance; Motion for premium feel. |
| **Backend** | Fastify (Node.js) | Low overhead, high throughput API handling. |
| **Database** | PostgreSQL / SQLite | Relational data integrity for match history. |
| **Security** | HashiCorp Vault | Centralized secret management (No hardcoded keys!). |
| **DevOps** | Docker Compose, Makefile | 1-command deployment and environment isolation. |

---

## 📸 Visual Showcase
<!--*(Add your GIFs here! Recruiter Tip: People watch videos more than they read code.)*-->

### � Live Demonstrations
| **Remote Game** | **Tournament Mode** |
|:------------------:|:-------------------:|
| ![Remote](/uploads/gifs/remote.gif) | ![Tournament](/uploads/gifs/Tournament.gif) |

| **Interactive Dashboard** | **Real-Time Chat** |
|:------------------:|:-------------------:|
| ![Dashboard](/uploads/gifs/seeded%20dsahboard.gif) | ![Chat](/uploads/gifs/Chat.gif) |

| **Secure Auth Flow (2FA)** | **Grafana Monitoring** |
|:------------------:|:-------------------:|
| ![Auth](/uploads/gifs/auth.gif) | ![Grafana](/uploads/gifs/grafana.gif) |

### �🎮 Gameplay & Matchmaking
| **Remote Match Launcher** | **Tournament Launcher** |
|:------------------:|:-------------------:|
| ![Remote Match](/uploads/screenshots/remote%20match%20luncher.png) | ![Tournament](/uploads/screenshots/tournament%20luncher.png) |

| **Local Launcher** | **Matches History** |
|:------------------:|:-------------------:|
| ![Local Match](/uploads/screenshots/local%20luncher.png) | ![History](/uploads/screenshots/matches%20history.png) |

### 👤 User Profile & Settings
| **User Profile** | **Account Settings** |
|:------------------:|:-------------------:|
| ![Profile](/uploads/screenshots/profile.png) | ![Settings](/uploads/screenshots/settings.png) |

### 🔐 Authentication
| **Login Page** | **Registration** |
|:------------------:|:-------------------:|
| ![Login](/uploads/screenshots/login.png) | ![Register](/uploads/screenshots/register.png) |

### 💬 Social & Features
| **Live Chat** | **Dashboard (Main)** |
|:------------------:|:-------------------:|
| ![Chat](/uploads/screenshots/chat.png) | ![Dashboard](/uploads/screenshots/dashboard-en.png) |

### 🌍 Internationalization & Accessibility
| **Dashboard (Arabic)** | **Dashboard (French)** |
|:------------------:|:-------------------:|
| ![Dashboard AR](/uploads/screenshots/dashboard-ar.png) | ![Dashboard FR](/uploads/screenshots/dsahboard-fr.png) |

| **High Contrast Mode** | **Dark Mode** |
|:------------------:|:-------------------:|
| ![High Contrast](/uploads/screenshots/dashboard-hight-contrast.png) | ![Dark Mode](/uploads/screenshots/dsahboard-dark.png) |

---

## 🛠️ Getting Started
We believe in "Infrastructure as Code". You don't need to configure 10 files to run this.

### Prerequisites
- Docker & Docker Compose
- Make

### Installation
1. **Clone the repository**
   ```bash
   git clone git@github.com:salahrachidi/The-transcendence.git
   cd ft_transcendence
   ```

2. **Launch the Infrastructure**
   ```bash
   make up
   ```
   *This command orchestrates the frontend, backend, database, and Vault containers automatically.*

3. **Access the App**
   Open [https://localhost](https://localhost) in your browser. (Accept the self-signed certificate, part of our HTTPS setup).

---

## 💡 Challenges Solved
- **Immersive Arcade UI:** Crafted a custom Glassmorphism/Neon design language using **TailwindCSS**, **Framer Motion**, and **Lucide Icons** to enhance user immersion to the Arcade game vibe.
- **The "Cookie" Dilemma:** Solving `SameSite=Strict` policies while handling cross-container communication.
- **Secret Zero:** Bootstrapping Vault securely without hardcoding the initial unseal tokens in the application code.
- **State Synchronization:** Handling race conditions in real-time game logic using optimistic UI updates.

---

## 📬 Contact
**Mehdi El Akary** - AI/ML & DevOps Enthusiast
[LinkedIn](https://www.linkedin.com/in/elakarymehdi/) | [GitHub](https://github.com/callmemehdy)

**Salaheddine rachidi** - Full-Stack & Robotics & AI/ML Enthusiast
[LinkedIn](https://www.linkedin.com/in/rachidi1/) | [GitHub](https://github.com/salahrachidi)

**mohamed elhoudaigui** - AI/ML & Backend Enthusiast
[LinkedIn](https://www.linkedin.com/in/mohamed-el-houdaigui-4389a6385/) | [GitHub](https://github.com/mohamedelhoudaigui)

**Anas El Ammari** - CyberSecurity & AI/ML Enthusiast
[LinkedIn](https://www.linkedin.com/in/anas-ri/) | [GitHub](https://github.com/gitraiden)
