<div align="center">
  <h1>The Transcendence</h1>
  <h3>The Ultimate Ping Pong Platform 🏓</h3>
</div>

<div align="center">
  <a href="https://www.youtube.com/watch?v=pO4oQQxJ3yk" target="_blank">
    <img src="https://img.youtube.com/vi/pO4oQQxJ3yk/0.jpg" alt="The Transcendence" width="480" height="360" border="10" />
  </a>
  <br>
  <sub>🎥 <strong>Click the image above to watch the gameplay demo</strong></sub>
</div>

---

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-Backend-000000?logo=fastify&logoColor=white)
![Vault](https://img.shields.io/badge/Vault-Secured-black?logo=vault&logoColor=white)
![Testing](https://img.shields.io/badge/Tests-Passing-green)

> **"Not just a game. A lesson in secure, scalable, real-time architecture."**

</div>

## 📑 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features--the-why)
- [Architecture](#%EF%B8%8F-architecture)
- [Visual Showcase](#-visual-showcase)
- [Getting Started](#%EF%B8%8F-getting-started)
- [Challenges Solved](#-challenges-solved)
- [Contact](#-contact)

---

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
- **📊 Interactive Dashboard:** Dynamic visualizations of user stats and match history.

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
