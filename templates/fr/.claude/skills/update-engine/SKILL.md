---
name: update-engine
description: "Met à jour le MOTEUR de ton second cerveau (le code de recherche RAG, les launchers et les scripts du moteur) vers une version plus récente, sur opt-in et sans jamais toucher à tes notes, ton .env, ta constitution, tes réglages, tes skills à toi ni aucun skill du moteur que tu as personnalisé. Réindexe uniquement si le format d'index a changé. À utiliser quand l'utilisateur demande de mettre à jour le moteur de son cerveau, ou de vérifier si une mise à jour est disponible."
version: 1.3.0
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
  à jour, mais **jamais la lancer sans le feu vert explicite de la personne**, et **jamais la
  proposer à l'aveugle** : le `--check` en lecture seule de l'Étape 1 est ce qui transforme
  « il y a peut-être quelque chose » en « voilà ce que c'est ».

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
| skills du moteur **que tu n'as jamais modifiés** : _remis à jour_ (ADR 0026 §8) | tout skill du moteur **que tu as personnalisé** : conservé à l'octet près, la version plus récente du moteur étant posée **à côté** en `.new`, et proposée comme un choix (Étape 4), jamais en silence |
| serveurs MCP du moteur **manquants** dans `.mcp.json` : _ajoutés s'ils sont absents_ (ADR 0025) | tout serveur que tu as ajouté toi-même à `.mcp.json` |

## Procédure

### Étape 1 : savoir ce que la mise à jour apporte, PUIS demander (obligatoire, opt-in)

🛑 **Ne jamais demander un oui avant de pouvoir dire ce que ce oui apporte.** Annoncer la
version que la personne a déjà et demander « je lance ? », c'est faire consentir à un
remplacement de code qui ne sait pas répondre à « pour quoi faire ? ». Donc **lance d'abord
la vérification en lecture seule**, depuis le **dossier du cerveau** :

```bash
node scripts/update-engine.mjs --check
```

Elle ne change **rien** (pas de clone, pas d'installation, pas de réindexation), c'est la
première étape de la vraie mise à jour, et elle sort toujours en `0`, y compris quand elle
n'a pas pu savoir : c'est une **réponse**, pas un échec. Relaie ensuite ce qu'elle a affiché,
**dans la langue de la personne**.

**Cite la prose des releases, ne la résume jamais.** Les puces `What you get` affichées
viennent de notes de version déjà écrites pour un public non technique et déjà relues ; un
résumé glisserait une étape générée sous une décision prise sur parole (ADR 0009). Traduis-les
si besoin, garde les puces, n'ajoute rien.

**Trois réponses, trois conversations différentes :**

- **`📦 … is available`** : dis **quelle version la personne s'apprête à installer** et de
  combien de releases elle est en retard, puis cite le `What you get` de chacune. Seulement
  après, explique ce que fait une mise à jour (ci-dessous) et demande un **oui** explicite.
- **`✅ That is the latest release`** : dis-le et **arrête-toi là**, il n'y a **rien à installer**.
  Ne lance **pas** la mise à jour « au cas où » : elle reposerait le même code, afficherait une
  bannière de redémarrage, et coûterait un redémarrage pour rien.
- **`❓ I could not find out`** : dis-le tel quel, **avec la raison affichée** :
  « **je n'ai pas pu savoir** ce qui est disponible en amont, parce que … ».
  Jamais sous la forme « il n'y a pas de mise à jour » : ce sont deux réponses opposées.
  Mettre à jour reste possible, mais le consentement ne serait **pas éclairé** : dis-le
  simplement et laisse la personne décider. Si elle y va, la mise à jour résout la cible
  elle-même et installe ce que la source contient.

Ensuite, avant le oui, explique simplement :
- ça récupère un moteur plus récent et remplace le nouveau code, les launchers et les scripts
  du moteur ;
- **tes notes, ton `.env`, ta constitution, tes réglages et tes skills à toi restent
  intacts** ;
- ça **remet à jour les skills du moteur que tu n'as jamais modifiés**, pour que les
  améliorations livrées depuis l'installation de ce cerveau finissent par lui parvenir ;
  **tout ce que tu as personnalisé reste exactement tel que tu l'as écrit**, la version plus
  récente du moteur étant posée à côté ; ensuite il te **posera la question**, fichier par
  fichier : prendre la nouvelle, garder la tienne, ou combiner les deux ;
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
  - S'il indique que des fichiers ont été **laissés tels quels** parce qu'ils portent les
    modifications de la personne, ce n'est pas une note de bas de page : c'est une **question
    qui attend d'être posée**. Relaie-le, puis passe à l'**Étape 4**. Ne termine pas la
    conversation sur « ta version a été conservée » : c'est exactement cette phrase qui a
    laissé un fichier gelé pendant des mois sans que personne ne s'en aperçoive.
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

### Étape 4 : les fichiers laissés tels quels, **pose la question**, ne te contente pas de les mentionner

Un fichier que le moteur a laissé tel quel est un fichier **que la personne a personnalisé**
et que le moteur ne pouvait pas mettre à jour sans risque. Le dire puis passer à autre chose,
c'est précisément ce que cette version vient arrêter : la version posée à côté en `.new` est
une proposition que personne n'a jamais formulée à voix haute.

Cette étape est une **conversation**, pas un rapport. Elle peut avoir lieu juste après une mise
à jour, ou des jours plus tard quand la personne pose la question : les propositions restent
ouvertes tant qu'elles n'ont pas de réponse.

#### Dis ce qui diffère vraiment, avec ses mots à elle

Ouvre les deux versions (la sienne, et le `.new` posé à côté), lis-les, et dis **ce qu'elle a
changé** et **ce qu'apporte la nouvelle version**. Deux ou trois phrases simples par fichier.

- **Aucun marqueur de conflit**, aucun diff brut, aucun numéro de ligne.
- **Jamais un chemin de fichier en titre.** « Ton skill coach » d'abord ; le chemin seulement
  si elle le demande.
- Si la nouvelle version n'apporte rien qui l'intéresse, **dis-le aussi** : c'est une vraie
  réponse, et ça rend le choix « je garde la mienne » évident.

#### Puis propose trois choses, jamais moins

> **Prendre la nouvelle** : la version du moteur remplace la sienne. Sa version actuelle est
> **d'abord sauvegardée dans l'historique du cerveau**, toujours, donc rien n'est perdu.
> **Garder la mienne** : sa version reste. Le moteur arrête d'en parler jusqu'à sa prochaine version.
> **Combiner les deux** : le meilleur des deux, la seule proposition qu'une conversation peut faire.

**Combiner, c'est ton travail à toi, et c'est pour ça que c'est un skill et pas un script.**
Lis les deux versions, écris la combinaison toi-même, montre-la, et ne l'applique qu'une fois
qu'elle est d'accord. Une fusion mécanique ne sait pas faire ça ici : ces fichiers n'ont
**aucun ancêtre commun** dont partir, ce qui est exactement la raison pour laquelle le moteur
les a laissés tranquilles.

#### Applique la réponse avec la commande, jamais en éditant le fichier

```bash
node scripts/adopt-engine-file.mjs <fichier> take-theirs
node scripts/adopt-engine-file.mjs <fichier> keep-mine
node scripts/adopt-engine-file.mjs <fichier> combine --from <chemin-de-ta-combinaison>
```

🛑 **N'écris jamais le fichier toi-même, pas même pour « je garde la mienne ».** La commande
fait trois choses qu'une édition ne fait pas : elle **sauvegarde la version actuelle dans
l'historique du cerveau avant d'écraser quoi que ce soit**, elle enregistre la version du
moteur comme nouvel **ancêtre** du fichier pour que les mises à jour suivantes puissent
fusionner au lieu de reposer la question, et elle retient la réponse pour ne pas la redemander
avant la prochaine version. Édite le fichier directement, et il sera resoulevé à chaque
version, indéfiniment ; et sur « prendre la nouvelle », son travail est écrasé sans retour
possible.

Pour **combiner**, écris ta combinaison dans un fichier de travail et passe-le avec `--from` :
les octets adoptés sont exactement ceux qu'elle a validés.

**Ce que la commande te répond :**

- **`exit 0`** : appliqué. Relaie sa phrase, elle dit ce qui a changé et ce qui se passe ensuite.
- **`exit 1`** : **rien n'a été touché**, et la raison la concerne, elle, pas une nouvelle
  tentative : git n'a pas encore de nom/email configuré, une fusion est en cours dans le dépôt
  de son cerveau, ou il n'y avait aucune version plus récente en attente. Relaie la phrase telle
  quelle et laisse-la décider. **Ne relance pas la commande en espérant une autre réponse.**
- **`exit 2`** : c'est toi qui as mal appelé. Corrige l'appel, ne montre jamais ce message.

#### Douze fichiers ne doivent pas devenir douze questions

Si plusieurs fichiers attendent, **regroupe-les d'abord**. Nomme-les en une courte liste, puis
propose, pour l'ensemble : **prendre toutes les nouvelles**, **garder toutes les miennes**, ou
**passons-les en revue un par un**. N'ouvre la conversation détaillée ci-dessus que pour ceux
qu'elle veut vraiment regarder.

Si elle ne dit rien, ou dit « plus tard », c'est une réponse complète : laisse tout en l'état.
Les propositions ne sont pas perdues, le moteur les rementionnera, et elles n'expirent jamais
avant la prochaine version.

## Cas limites
- **Aucune source enregistrée** (`source.repo` est null — p. ex. un cerveau dont le launcher
  n'avait pas de remote) → le cœur lève une erreur claire ; indique à l'utilisateur d'où un
  moteur plus récent devrait être récupéré, ou qu'il faut d'abord brancher un remote.
- **Réseau / git / npm indisponible** → le cœur échoue bruyamment ; relaie-le. Rien n'est laissé
  à moitié appliqué au-delà de l'échec.
- **Déjà à jour** → la vérification de l'Étape 1 le dit (`✅`) et la conversation s'arrête là.
  Si la personne insiste quand même, re-récupérer la même version est sans danger : le moteur
  est de nouveau remplacé et, comme le format d'index n'a pas bougé, **aucune réindexation**
  n'a lieu, mais un redémarrage lui sera quand même demandé, pour aucun changement.
