---
name: update-engine
description: "Met à jour le MOTEUR de ton second cerveau (le code de recherche RAG, les launchers et les scripts du moteur) vers une version plus récente, sur opt-in et sans jamais toucher à tes notes, ton .env, ta constitution, tes réglages, tes skills à toi ni aucun skill du moteur que tu as personnalisé. Réindexe uniquement si le format d'index a changé. À utiliser quand l'utilisateur demande de mettre à jour le moteur de son cerveau, ou de vérifier si une mise à jour est disponible."
version: 1.1.0
---

# /update-engine — Mets à jour le moteur de ton cerveau (opt-in, non destructif)

> Skill côté cerveau. Le **moteur**, c'est la machinerie sur laquelle tourne ton cerveau —
> le code de recherche RAG (`rag/`), les launchers et les scripts du moteur. Ce skill le
> remplace par une version plus récente épinglée dans le launcher qui t'a généré, **sans
> jamais toucher à ce qui est à toi** : tes notes, ton `.env`, ta constitution
> (`CLAUDE.md`), ton `.claude/settings.json`, tes skills à toi et **tout skill du moteur que
> tu as personnalisé** restent **identiques à l'octet près**.
>
> ⚠️ **Ce skill n'est qu'un pilote conversationnel mince.** Tout le vrai travail, testable,
> vit dans le cœur déterministe `scripts/update-engine.mjs` (ADR 0016). Ce skill se contente
> de **confirmer avec l'utilisateur, lancer le cœur, et rendre compte** — il ne porte aucune
> logique propre.

## Quand l'utiliser

- L'utilisateur demande de **mettre à jour / upgrader le moteur de son cerveau** (« mets à
  jour ton moteur », « y a-t-il une nouvelle version de mon cerveau ? »).
- De façon proactive : parce que le moteur est **observable** (il enregistre sa version + où
  aller chercher une mise à jour dans `engine-manifest.json`), tu peux **proposer** une mise
  à jour — mais **jamais la lancer sans le feu vert explicite de l'utilisateur**.

## Règle d'or — OPT-IN, JAMAIS automatique

Ne lance **pas** le cœur tant que l'utilisateur n'a pas clairement confirmé. Une mise à jour
du moteur modifie du code sur le disque et peut déclencher une réindexation ; ça doit
toujours être une action consciente et acceptée.

## Ce qui est touché vs ce qui ne l'est JAMAIS

| Mis à jour (au moteur) | **Jamais touché (à toi)** |
| --- | --- |
| code de recherche `rag/` + deps | tes **notes** (tout le `vault/`) |
| launchers `rag/launch.*`, `scripts/run-node.*` | `.env` (tes clés) |
| scripts du moteur (`auto-commit`, `auto-push`, `status-line`, `verify-rag`) | `CLAUDE.md` (ta constitution) |
| `update-engine` lui-même (il s'auto-met à jour) | `.claude/settings.json` |
| skills du moteur **manquants** (p. ex. `local-mirror`) : _ajoutés s'ils sont absents_ (ADR 0025) | **tes** skills à toi (`.claude/skills/**`) : le moteur ne les déclare pas, il ne peut donc jamais les écrire |
| skills du moteur **que tu n'as jamais modifiés** : _remis à jour_ (ADR 0026 §8) | tout skill du moteur **que tu as personnalisé** : conservé à l'octet près, la version plus récente du moteur étant posée **à côté** en `.new` |
| serveurs MCP du moteur **manquants** dans `.mcp.json` : _ajoutés s'ils sont absents_ (ADR 0025) | tout serveur que tu as ajouté toi-même à `.mcp.json` |

## Procédure

### Étape 1 — Confirmer avec l'utilisateur (obligatoire, opt-in)
Explique, simplement :
- ça récupère un moteur plus récent et remplace le nouveau code, les launchers et les scripts
  du moteur ;
- **tes notes, ton `.env`, ta constitution, tes réglages et tes skills à toi restent
  intacts** ;
- ça **remet à jour les skills du moteur que tu n'as jamais modifiés**, pour que les
  améliorations livrées depuis l'installation de ce cerveau finissent par lui parvenir ;
  **tout ce que tu as personnalisé reste exactement tel que tu l'as écrit**, la version plus
  récente du moteur étant simplement posée à côté en `.new`, libre à toi de l'adopter ou de
  l'ignorer ;
- ça **réindexe uniquement si le format d'index a changé** (quelques minutes, rien de perdu —
  tes notes sont simplement ré-encodées) ;
- **prérequis** : `git`, `npm` et une connexion réseau (comme à l'installation). Ici
  `npm install` veut dire installer les **dépendances locales** du moteur RAG — rien n'est
  publié ni récupéré depuis un registre de paquets.

Puis demande un **oui** explicite avant de continuer.

### Étape 2 — Lancer le cœur déterministe
Depuis le **dossier du cerveau**, lance :
```bash
node scripts/update-engine.mjs
```
Il récupère un **clone superficiel jetable** de la source enregistrée dans un dossier temporaire,
applique exactement les fichiers du moteur, régénère les launchers, lance `npm install`, réindexe
**ssi** le format d'index a bougé, enregistre la nouvelle version, puis jette le dossier temporaire.

### Étape 3 — Rendre compte (ne pas faire semblant)
- **`exit 0`** → relaie le résumé affiché (nouvelle version, combien de fichiers du moteur ont
  été remplacés, si une réindexation a eu lieu). Rassure : rien de ce qui est à l'utilisateur
  n'a été touché.
  - Si le résumé liste des **skills du moteur remis à jour**, nomme-les : une amélioration
    livrée il y a des mois vient enfin d'arriver dans ce cerveau ; la livrer en silence, c'est
    laisser la personne ignorer qu'elle l'a désormais.
  - S'il indique qu'un **skill personnalisé a été conservé**, relaie-le aussi, **avec le chemin
    du fichier `.new`** : sa version reste intacte, et la version plus récente du moteur est
    posée à côté. Propose de comparer les deux, ou d'intégrer les nouveautés dans la sienne.
- **`exit 1`** → **relaie l'erreur telle quelle** et dis à l'utilisateur que le cerveau n'a pas
  été modifié au-delà du point d'échec. **Ne prétends jamais que ça a marché si ça a échoué.**

> 🔁 **OBLIGATOIRE — si la sortie porte la bannière `ENGINE UPDATE UNFINISHED — AGENT, RUN THE
> UPDATE ONCE MORE`, relance `node scripts/update-engine.mjs` une seconde fois, tout de suite, SANS
> reposer la question** (la personne a déjà demandé cette mise à jour). Ce cerveau vient d'un moteur
> antérieur à la **v3.3.0**, dont l'orchestrateur ne relance pas le réconciliateur fraîchement
> écrit : la première passe pose le nouveau moteur sur le disque, **seule la seconde remet à jour
> ses skills du moteur restés intacts**. Rends compte du résumé de la **SECONDE** passe et de sa
> consigne de redémarrage, pas de ceux de la première, sans faire attendre la personne derrière une
> question intermédiaire. **Aucune boucle possible** : la seconde passe enregistre les nouvelles
> versions, donc la bannière disparaît. _(Vecteur transitoire pour la cohorte pré-v3.3.0 ; il
> disparaîtra avec elle.)_

> **Si le résumé indique que de nouveaux skills/MCP ont été installés** (l'avertissement
> « ACTION NEEDED ») : dis à l'utilisateur qu'un **redémarrage complet de Claude** (fermer puis
> rouvrir) suffit, puis de **revenir dans CETTE même conversation** — la nouvelle capacité se
> charge au prochain démarrage. **Ne lui dis pas d'ouvrir une conversation toute neuve** pour
> ça : c'est la règle de *rooting initial* (uniquement pour une session pas encore ancrée dans
> le cerveau), **pas** ce qu'il faut pour capter un nouveau skill+MCP. Un redémarrage en
> reprenant cette conversation est l'action la plus légère et suffisante.

## Cas limites
- **Aucune source enregistrée** (`source.repo` est null — p. ex. un cerveau dont le launcher
  n'avait pas de remote) → le cœur lève une erreur claire ; indique à l'utilisateur d'où un
  moteur plus récent devrait être récupéré, ou qu'il faut d'abord brancher un remote.
- **Réseau / git / npm indisponible** → le cœur échoue bruyamment ; relaie-le. Rien n'est laissé
  à moitié appliqué au-delà de l'échec.
- **Déjà à jour** → re-récupérer la même version est sans danger ; le moteur est de nouveau
  remplacé et, comme le format d'index n'a pas bougé, **aucune réindexation** n'a lieu.
