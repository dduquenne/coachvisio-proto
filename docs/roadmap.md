# Roadmap produit CoachVisio

## 0. Point de départ : prototype actuel
- **Parcours de simulation unifié** : accès via authentification simple et redirection automatique des utilisateurs authentifiés vers la simulation d'entretien. L'expérience inclut la sélection d'une persona, le déclenchement d'un minuteur, l'affichage des messages et la génération d'une synthèse finale.【F:app/page.tsx†L1-L13】【F:app/components/InterviewPageClient.tsx†L15-L129】【F:app/components/InterviewPageClient.tsx†L174-L247】
- **Interactions multimodales** : prise en charge des messages texte et de la dictée vocale avec détection de silence, ainsi que la lecture audio synchronisée avec l'avatar 3D via l'API TTS et l'analyseur audio.【F:app/components/Composer.tsx†L13-L146】【F:app/api/speech/route.ts†L1-L63】【F:app/components/Avatar.tsx†L1-L124】【F:app/components/Avatar.tsx†L155-L209】
- **Moteur IA** : streaming de réponses contextualisées selon la persona choisie et génération d'une synthèse structurée post-entretien.【F:app/api/chat/route.ts†L1-L102】【F:app/api/chat-summary/route.ts†L1-L83】【F:app/personas.ts†L1-L35】
- **Export des résultats** : téléchargement d'un PDF combinant le verbatim et la synthèse pour capitaliser sur l'entraînement.【F:app/components/Controls.tsx†L1-L103】

Ce socle démontre la valeur du produit (interaction réaliste, feedback immédiat) mais requiert industrialisation pour correspondre aux offres **Starter**, **Pro** et **Entreprise** décrites dans la proposition commerciale.【F:docs/proposition-commerciale.md†L13-L38】

## 1. Phase Alpha → Bêta fermée (M0-M2)
### Objectifs
- Stabiliser le prototype pour des pilotes internes / clients accompagnés.
- Préparer la mesure d'usage et la collecte de feedback.

### Parcours & fonctionnalités
- **Gestion des comptes de test** : portail d'administration léger pour créer des accès temporaires (10-20 utilisateurs) et visualiser les sessions réalisées.
- **Instrumentation** : suivi analytique basique (temps passé, persona utilisée, durée des réponses) + journaux d'erreurs pour le moteur IA.
- **Expérience utilisateur** : onboarding guidé (tutoriel rapide), amélioration du timer (pré-réglages, pause), gestion fine des silences (relances configurables).
- **Qualité de service** : file d'attente et messages d'indisponibilité en cas d'erreur OpenAI, surveillance du quota API.

### Plateforme & technique
- Conteneurisation de l'application + pipeline CI/CD (lint, tests, déploiement staging).
- Mise en place d'un datalake léger (base Postgres) pour stocker métadonnées de sessions (sans contenu sensible) et permissions utilisateur.

### Validation
- 5 à 10 pilotes internes, NPS ≥ +20, taux de plantage <2 %.
- Alignement produit/vente : production d'un kit de démonstration pour les équipes commerciales.

## 2. Phase MVP commercial – Offre Starter (M2-M4)
### Objectifs
- Lancer l'offre Starter : 30 sessions/mois, 2 personas standard, feedback automatisé basique, support communautaire.【F:docs/proposition-commerciale.md†L19-L23】

### Évolutions clés
- **Gestion des licences** : limitation automatique du nombre de sessions par utilisateur + facturation mensuelle (Stripe / chargebee) et plan Starter.
- **Catalogue de contenus** : bibliothèque de scénarios Starter (tags métiers, filtres) + 2 personas « standards » pré-sélectionnées.
- **Feedback basique** : version condensée de la synthèse (forces/vigilances uniquement) avec recommandation générique.
- **Support** : base de connaissances intégrée et widget d'entraide communautaire (forum / Discord).
- **Sécurité & conformité** : RGPD (registre de traitement, consentement audio), hébergement cloud EU, purge automatique des enregistrements au-delà de 30 jours.

### Go-to-market
- Landing page d'inscription, emailing d'onboarding, suivi trial → conversion.
- Tableau de bord Starter pour l'utilisateur final (sessions restantes, progression).

## 3. Phase Offre Pro (M4-M7)
### Objectifs
- Couvrir les attentes des PME/cabinets : sessions illimitées, 5 personas, personnalisation scénarios, export PDF, API, espace manager, support 24 h.【F:docs/proposition-commerciale.md†L23-L27】

### Fonctionnalités prioritaires
- **Espace manager** : tableaux de bord équipe (score d'engagement, temps moyen, heatmap des axes d'amélioration), gestion des licences et invitations.
- **Personnalisation** : studio de scénarios (éditeur no-code, import/export CSV), tagging des compétences, partage de scripts internes.
- **Intégrations API** : endpoints REST/GraphQL pour pousser les rapports, webhooks (session terminée, synthèse prête), connecteur Zapier.
- **Collaboration** : annotations entre pairs, commentaires coach, historique des versions de scénarios.
- **Support** : portail ticketing, SLA réponse 24h, statut service public (status page).

### Technique & opérations
- Montée en charge (autoscaling), monitoring applicatif (APM), observabilité IA (latence, coût par session).
- Début d'internationalisation (en-US) pour élargir la cible.

## 4. Phase Offre Entreprise (M7-M12)
### Objectifs
- Répondre aux exigences grands comptes : personas sur mesure, analytics avancés, multi-équipes, SSO, SLA 99,9 %, accompagnement dédié.【F:docs/proposition-commerciale.md†L27-L31】

### Fonctionnalités & services
- **Personas & contenus sur mesure** : pipeline de co-conception (atelier, script, validation juridique) + bibliothèque privée par client.
- **Analytics avancées** : indicateurs agrégés par BU/pays, scoring automatique (IA) basé sur grille de compétences, export data warehouse (S3/BigQuery).
- **Gouvernance & conformité** : SSO (SAML/SCIM), rôle DPO, traçabilité et audit logs, hébergement dédié UE/US, plan de continuité (PCA/PRA).
- **Qualité de service** : architecture haute disponibilité (multi-zone), monitoring 24/7, alerting on-call, revue mensuelle avec TAM.
- **Intégrations avancées** : connecteurs LMS/ATS (SCORM/xAPI), API temps réel, options d'hébergement on-prem/hybride (sur devis).
- **Accompagnement** : package "projet pilote clé en main" + comité de pilotage trimestriel.【F:docs/proposition-commerciale.md†L33-L44】

### Mesure de succès
- ≥3 logos Enterprise signés, SLA respecté >99,9 %, satisfaction décideurs >8/10.

## 5. Chantiers transverses
### Contenus & pédagogie
- Roadmap trimestrielle de nouvelles personas/scénarios par segment (indépendants, PME, grandes entreprises, éducation).【F:docs/proposition-commerciale.md†L39-L59】
- Programme de co-animation avec les coachs partenaires (interface dédiée, licences coach).【F:docs/proposition-commerciale.md†L45-L48】

### Plateforme data & IA
- Stockage chiffré des transcriptions, pipeline d'anonymisation, dataset d'entraînement pour scoring automatique.
- Veille technologique IA (modèles voix, émotion, agent coaching) + gestion des coûts (optimisation tokens, cache réponses).

### Support & réussite client
- Mise en place du support premium (7j/7) pour l'option dédiée.【F:docs/proposition-commerciale.md†L63-L67】
- Processus de feedback client → roadmap (revues trimestrielles, portal idée).

### Commercial & partenariats
- Offre white-label et programme revendeur : branding personnalisable, support marketing co-brandé, gestion des marges partenaires.【F:docs/proposition-commerciale.md†L55-L62】
- Kits formation interne (webinars, certification CoachVisio) pour accélérer l'adoption.【F:docs/proposition-commerciale.md†L35-L44】

## 6. Jalons & dépendances majeures
| Mois | Jalons clés | Dépendances |
|------|-------------|-------------|
| M0   | Lancement pipeline CI/CD, instrumentation prototype | Ressources DevOps, budget hébergement |
| M1   | Pilotes bêta + collecte feedback | Disponibilité clients pilotes |
| M2   | Release MVP Starter (licensing, facturation) | Intégration paiement, conformité RGPD |
| M4   | Sortie Offre Pro (studio scénarios, API, espace manager) | Équipe produit + contenus, support 24h |
| M7   | Certification sécurité (ISO/SOC), SSO, analytics avancées | Budget sécurité, équipe data |
| M9   | Connecteurs LMS/ATS, pipeline personas sur mesure | Partenariats éditeurs, experts pédagogiques |
| M12  | Offre Entreprise complète (SLA, PCA/PRA, hébergement dédié) | Équipe infra 24/7, TAM recruté |

Cette roadmap permet de passer d'un prototype fonctionnel à une plateforme SaaS industrialisée, parfaitement alignée sur les paliers commerciaux Starter, Pro et Entreprise et leurs options associées.【F:docs/proposition-commerciale.md†L13-L67】
