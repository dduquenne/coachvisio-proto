# Prompt Codex – Plan pour Exerzia (SaaS finalisé)

Tu es Codex, assisté de la fonction `Plan`. Ta mission est de générer **l'intégralité du code** et des assets nécessaires pour livrer **Exerzia**, la version SaaS industrialisée de CoachVisio. Suis précisément les directives suivantes :

1. **Utilise la fonction `Plan` avant d'écrire du code.**
   - Construis un plan hiérarchisé couvrant toutes les étapes : configuration du monorepo/Next.js, base de données, API, front-end, automatisation, tests, sécurité, monitoring et déploiement.
   - Chaque item doit indiquer les livrables (fichiers, modules, schémas DB) et les dépendances techniques.
   - Valide que le plan couvre les trois offres commerciales (Starter, Pro, Entreprise) ainsi que les chantiers transverses (contenus, data/IA, support, partenariats).

2. **Contexte technique de référence**
   - Stack : Next.js App Router (TypeScript), React Server/Client components, Tailwind CSS, Radix UI, Zustand, React Query, tRPC ou REST, Prisma ORM, PostgreSQL multi-tenant (schéma par organisation), Redis pour cache/queues, WebSockets (Pusher/Ably) pour temps réel, stockage S3 compatible, Supabase/Auth.js pour auth, Stripe Billing, Playwright + Vitest.
   - Infrastructure : Docker + Docker Compose (dev), Terraform IaC pour prod (AWS ou Scaleway EU), CI/CD GitHub Actions, observabilité (OpenTelemetry, Sentry, PostHog), feature flags (LaunchDarkly ou solution maison).
   - IA & médias : intégration OpenAI GPT-4o mini pour coach virtuel, Whisper large-v3 pour transcription, ElevenLabs (ou TTS libre) pour voix, WebRTC pour streaming, pipeline d'analyse émotionnelle.

3. **Fonctionnalités majeures à implémenter**
   - **Expérience utilisateur** : onboarding guidé, bibliothèque de scénarios/personas, éditeur no-code (drag & drop) pour scénarios, simulateur d'entretien vidéo interactif (avatar 3D, dictée vocale, synthèse IA), feedback multi-niveaux (forces, axes, recommandations, scoring), export PDF/CSV, historique, favoris, mode révision.
   - **Espace manager & analytics** : gestion multi-équipes, invitations, attribution licences, dashboards (heatmaps, cohortes, coûts), annotations collaboratives, workflows d'approbation.
   - **Facturation & plans** : gestion essais gratuits, paiement Stripe (Starter/Pro), facturation usage pour Enterprise, coupons, factures PDF, portail de facturation, limites d'usage, relances d'échec.
   - **Support & conformité** : centre d'aide, système ticketing, base de connaissances, consentements RGPD, anonymisation, politique rétention, audit logs, SSO (SAML/SCIM), RBAC hiérarchique, double authentification.
   - **Intégrations** : API publique (REST + webhooks), connecteurs LMS/ATS (SCORM/xAPI), Zapier, import/export CSV, SDK JS/TS.
   - **Opérations** : monitoring 24/7, statut service, alertes on-call, PCA/PRA, scripts migration DB, seed data, tests E2E, linting, storybook.

4. **Livrables attendus**
   - Projet complet prêt pour déploiement (code, configs, documentation, scripts).
   - Documentation : README, guides d'architecture, runbooks incident, manuel produit, roadmap releases, manuel conformité, playbooks support.
   - Jeux de tests automatisés (unitaires, intégration, E2E) couvrant fonctionnalités critiques.
   - Fichiers de configuration déploiement (Docker, Terraform, GitHub Actions) et scripts de monitoring.

5. **Contraintes de qualité**
   - Respecte les bonnes pratiques de sécurité, accessibilité (WCAG 2.1 AA), performance (Core Web Vitals), internationalisation (FR/EN) et scalabilité.
   - Commente le code critique, rédige les tests, fournis exemples d'utilisation d'API.
   - Structure le dépôt de façon modulaire (packages/services) et documente chaque dossier.

6. **Format de réponse attendu**
   - Après avoir produit le plan avec `Plan`, exécute-le en générant l'ensemble des fichiers (utilise des blocs de code triés par chemin).
   - Termine par un récapitulatif des tests/scripts à exécuter et des instructions de déploiement.

7. **Ton & style**
   - Reste clair, structuré, exhaustif. Fais apparaître les justifications de design dans le plan et/ou la documentation.

Ce prompt doit permettre à Codex de recréer Exerzia comme une plateforme SaaS complète, prête pour les clients Starter, Pro et Entreprise, tout en capitalisant sur les acquis du prototype CoachVisio.
