---
name: sync-sources
description: "Architecture fan-out/fan-in pour aspirer le DELTA des sources externes (Slack, Google Drive / transcripts, Calendar, mail…) via des sous-agents parallèles en LECTURE SEULE. Référence technique interne — c'est le moteur de la Phase 2 du flux principal (question → sync sources en background) et d'un éventuel briefing du matin. Pas une commande utilisateur : ce sont tes questions qui déclenchent l'aspiration."
version: 1.0.0
---

# Sync sources — Architecture fan-out/fan-in (référence interne)

> **Ce n'est pas une commande utilisateur.** Ce fichier documente l'architecture des sous-agents
> de la **Phase 2** du flux principal (sync sources en background — cf. `CLAUDE.md`). Tu ne
> déclenches jamais l'aspiration à la main : c'est la question qui la déclenche. Note : `/sync`
> est une commande **distincte** qui synchronise le repo git entre machines.
>
> 🔧 **À adapter à tes connecteurs.** Les exemples ci-dessous référencent des outils MCP de façon
> générique (`mcp__<slack>__…`, `mcp__<drive>__…`, `mcp__<calendar>__…`). Remplace-les par les
> noms réels des connecteurs que tu as branchés (cf. [SETUP §6](../../../SETUP.md)). Sans connecteur
> branché, cette skill ne fait rien — le moteur RAG répond seul depuis le vault.

## Contrainte absolue

**LECTURE SEULE.** Ne jamais envoyer de message, de mail, ni de réaction. Ne jamais poster dans
un canal. Produire uniquement des fichiers markdown locaux dans le vault.

## Outillage des sous-agents — JAMAIS de shell pour traiter du texte

Les sous-agents sont des **LLM** : ils lisent et résument **par raisonnement**, pas via du shell.
**Interdiction d'utiliser `python3 -c`, `python`, `node -e`, `awk`, `sed`, `jq`, `grep`, `cat`,
`head`, `tail` — ou toute commande Bash — pour parser, charger, découper, slicer ou résumer un
contenu.** Pourquoi c'est non négociable (surtout sur Claude Desktop, onglet Code) :

- chaque commande ad-hoc est **unique** → elle redéclenche une **demande d'autorisation** à chaque
  appel (prompts sans fin, impossibles à pré-autoriser) ;
- certaines (multi-lignes, `#` dans un argument, redirections) sont **refusées par sécurité** et
  n'offrent même pas « Always allow » — l'utilisateur ne *peut pas* les accepter.

À la place :
- **Lire un contenu** → outil **`Read`** (un fichier du vault ; ou un résultat d'outil volumineux
  que Claude a déporté dans `…/tool-results/…` : lis-le avec `Read`, pas avec `python3 -c "open(...)"`).
- **Écrire** la source brute / le briefing → outils **`Write`** / **`Edit`**.
- **Découper** (« jusqu'à la section Détails », « les 4000 premiers caractères »…) → **dans ta tête**,
  pas en Python.

`Read`/`Write`/`Edit` sont pré-autorisés et silencieux. Le shell ne l'est pas et ne le sera jamais
de façon fiable : ne t'en sers pas pour de la manipulation de texte.

## Pourquoi cette architecture

Pour éviter le *context rot* (la qualité se dégrade dès ~50-70k tokens de contexte), on n'aspire
**jamais** les sources dans le contexte principal. On orchestre des **sous-agents en parallèle** :
chacun lit UNE source, en extrait le delta, et ne renvoie qu'un signal **pré-digéré (~500 tokens)**.
Le contexte principal ne reçoit que ces résumés compacts et fait la synthèse.

```
question (ou briefing du matin)
    │
    ├─► N sous-agents : transcript-extractor (un par nouveau document/transcript)
    ├─► 1 sous-agent : chat-extractor      (mentions + DMs depuis le dernier passage)
    ├─► 1 sous-agent : my-actions          (ce que TU as fait/écrit depuis le dernier passage)
    ├─► 1 sous-agent : calendar-reader     (agenda du jour) — souvent rapide, peut rester inline
    ▼
contexte principal = synthèse finale (~3-5k tokens d'input)
    → vault/briefings/YYYY-MM-DD.md  (si briefing)
    → vault/actions-log.md           (append)
```

## Référentiel de personnes (backlinks)

Pour des backlinks `[[people/prenom-nom]]` cohérents (pas de liens cassés), les sous-agents
s'appuient sur les fiches de `vault/people/`. Règle : **kebab-case, sans accents**
(`[[people/jane-doe]]`). **Jamais de prénom seul** (`[[people/jane]]` est interdit). Créer les
backlinks même si la page cible n'existe pas (*dangling links* OK) ; ne pas créer les pages cibles.

## Discipline d'affirmation

> **La sortie dangereuse d'un second cerveau, ce n'est pas le fait qu'il invente : c'est le SILENCE
> qu'il rapporte.** Deux échecs réels, à un jour d'intervalle : « pas de réponse depuis jeudi » à
> propos d'un thread qui avait **12 réponses le jour même** (bug ouvert, analyse postée), et
> « personne n'a tranché » sur une réouverture qui était **tranchée et planifiée**, responsable et
> back-up nommés. Les deux étaient à un clic d'être postés à l'équipe. Aucune hallucination :
> chaque fait avait bien été récupéré. Le défaut est entièrement dans le pas entre **récupérer** et
> **affirmer**.

Une recherche renvoie ce qui est **pertinent**, jamais ce qui est **complet**. Donc quand rien ne
remonte, c'est une propriété de ta requête, pas du monde. Trois niveaux, trois barres différentes :

| Niveau | De quoi il s'agit | La barre à franchir |
|---|---|---|
| **Observé** | contenu cité + source + date + lien | rien de plus que la citation |
| **Déduit** | une agrégation, une chronologie, une comparaison | traçable jusqu'aux observations listées |
| **Négatif ou comportemental** | « pas de réponse », « personne n'a tranché », « toujours pas démarré », « X n'a pas fait Y », **et toute résolution d'identité** | **nommer la vérification qui l'établit, ou ne pas l'écrire** |

Le troisième niveau, c'est tout l'enjeu : une affirmation négative sur une personne est une
**accusation**, et c'est exactement la formulation vers laquelle un briefing penche.

1. **Basculer la formulation par défaut.** Écrire « je n'ai pas trouvé X », jamais « il n'y a pas de
   X ». Ça coûte un mot et ça supprime toute la classe d'accusations.
2. **Une affirmation négative nomme sa vérification, ou devient une question ouverte** : « je n'ai
   pas trouvé de suite, quelqu'un a du contexte ? » plutôt que « personne n'a relancé ».
3. **Le thread est l'unité d'état** ; le message n'est que l'unité que les outils renvoient. Un
   message racine, c'est l'instant où la question a été **posée**, jamais sa résolution. Résoudre le
   thread avant de citer un message comme un état courant.
4. **Un nombre de réponses non nul bloque tout.** Réponses présentes et thread non lu : interdiction
   d'écrire « sans réponse », « en attente », « non tranché », « toujours en attente » sur ce
   message. Point.
5. **Citer via le connecteur qui expose l'état.** La découverte peut passer par le connecteur large
   et pas cher ; ce que tu cites vraiment est re-résolu via celui qui rend les **compteurs de
   réponses et les permaliens**.
6. **Réconcilier avant d'écrire.** Une passe sur ta propre récolte : est-ce que quelque chose dedans
   **contredit** ce que je m'apprête à affirmer ? Le pire des deux échecs tenait sa propre réfutation
   dans la même réponse d'outil (un message plus tardif de l'auteur qui commençait par « merci pour
   ta réponse très complète ») et a affirmé le contraire quand même.
7. **L'urgence est une propriété de l'état, pas du ton.** « Urgent », « bloquant », « pour le 1er »
   sont des mots à l'intérieur d'un message ; un message qui *sonne* urgent et qui est déjà traité
   n'est pas urgent. Trier par ton ne demande aucun thread, trier par état si.
8. **Doser l'effort au coût de l'erreur.** Se tromper sur un module livré ne coûte rien ; se tromper
   sur « P a démissionné » ou « l'équipe T n'a jamais répondu » coûte une relation. Mettre la
   diligence là où l'erreur est chère, pas uniformément.

### Le marquer dans l'artefact, pas seulement dans ta tête

La personne qui lit doit voir **d'un coup d'œil** quelles lignes sont sûres à répéter à voix haute.
Marquer toute affirmation de niveau 2 et 3 :

| Marqueur | Sens | Collable dans un message à un humain ? |
|---|---|---|
| ✅ | observé, cité | oui, tel quel |
| 🟡 | déduit ou probable | seulement en disant la déduction à voix haute |
| 🔴 | négatif ou comportemental, non vérifié | **jamais** : le reformuler en question d'abord |

« Probablement vrai » et « sûr à envoyer à la personne concernée » ne sont **pas** le même seuil, et
c'est le second qui compte.

### Le caveat d'hier est une dette, jamais la prémisse d'aujourd'hui

Un briefing précédent est une **source**, pas un fait, y compris le tien. C'est le mode de défaillance
propre à un cerveau *persistant* : il indexe sa propre incertitude et la relit comme une certitude.
Une des deux sessions ratées a démarré en héritant du caveat de la veille (« aucun signal sur la
facturation électronique, ce silence mérite d'être creusé »), qui était faux : il y en avait au moins
quatre. Avant de réutiliser quoi que ce soit d'un briefing précédent, **re-vérifier ce qu'il signalait
comme non vérifié** ; ne jamais le propager comme établi.

### Une capacité notée comme absente doit être retestée

Ce même vault avait consigné, comme limitation permanente, que « le connecteur Slack ne rend pas les
permaliens », l'avait propagé dans plusieurs notes, et lui obéissait. C'était faux : un mauvais choix
d'outil, pas une contrainte de plateforme, et le connecteur natif a rendu les permaliens au premier
appel. **Le cerveau avait écrit une fausse contrainte et lui obéissait.** Traiter une absence
consignée comme une mesure avec péremption : la retester avant de la laisser façonner une réponse, et
corriger la note quand l'outil sait finalement le faire.

## Procédure

### Étape 1 — Découverte des sources (contexte principal)

> **Outils natifs uniquement** (cf. constitution, section « Outillage »). Pour sonder l'état du
> vault avant le fan-out — dossiers `vault/briefings/`, fiches `vault/people/`, présence de
> `vault/actions-log.md` — utilise **`Glob`** et **`Read`**, **jamais** un Bash composé du genre
> `cd … && mkdir -p … && ls … && test -f …` (prompté à chaque fois, et refusé d'office car
> `cd`+écriture). `Write` crée les dossiers parents au moment d'écrire : pas de `mkdir` préalable.

En parallèle, repérer ce qui est **nouveau depuis le dernier passage** (delta) :

- **Transcripts / documents récents** : chercher dans ton Drive les docs modifiés depuis la
  veille (ou le dernier jour ouvré), p. ex. `mcp__<drive>__search(query="modifiedTime > 'YYYY-MM-DD…'")`.
  Collecter les `id` + titres : chacun deviendra un sous-agent transcript-extractor.
- **Agenda du jour** : `mcp__<calendar>__list_events` (rapide, peut rester dans le contexte principal).

### Étape 2 — Fan-out des sous-agents (EN PARALLÈLE, un seul message)

Lancer tous les sous-agents dans **un seul bloc d'appels parallèles**. Chacun écrit sa source
brute dans le vault et **retourne un résumé ~500 tokens max**.

#### Sous-agent « transcript-extractor » (un par document)

```
Agent(
  description="Extract transcript <slug>",
  prompt="""
Tu es un agent d'extraction de transcript de réunion. LECTURE SEULE.

TÂCHE :
1. Lire le document <DOC_ID> via ton connecteur Drive (mcp__<drive>__read_file).
2. Sauvegarder le contenu brut dans vault/raw-sources/transcripts/YYYY-MM-DD-<slug>.md
   avec ce frontmatter :
   ---
   type: transcript
   source: <connecteur>
   meeting: "<titre>"
   date: YYYY-MM-DD
   captured: <date du jour>
   ---
3. Retourner un résumé structuré (~500 tokens max) :

## Signaux — <titre>
### Mes engagements        # ce que TU as promis
- …
### Attentes envers moi    # ce qu'on attend de toi
- …
### À escalader            # 🔧 vers ta hiérarchie / tes pairs — adapte à ton orga
- …
### À partager             # 🔧 à ton équipe / tes interlocuteurs — adapte à ton orga
- …
### Backlinks
- Personnes : [[people/prenom-nom]]
- Topics : [[topics/nom-topic]]
- Source : [[raw-sources/transcripts/YYYY-MM-DD-slug]]

RÈGLES :
- Ne PAS inventer d'information absente du transcript.
- Un transcript enregistre ce qui a été DIT dans une réunion, jamais l'état courant de ce dont
  elle parle. Donc pas de « personne n'a tranché » / « toujours pas démarré » / « X n'a pas fait
  Y » tiré d'un transcript : écrire « je n'ai pas trouvé de décision dans ce transcript », et le
  marquer 🔴 (🟡 déduit, ✅ observé et cité) pour que le contexte principal sache que ce n'est pas
  répétable.
- Un prénom seul reste un prénom seul. Ne jamais le résoudre en identité complète : c'est une
  affirmation sur QUI est quelqu'un, et ça a déjà attribué une démission à la mauvaise personne.
- Créer les backlinks même si la page cible n'existe pas.
- Backlinks via vault/people/ (kebab-case sans accents, jamais de prénom seul).
- JAMAIS de shell (python3 -c, node -e, awk, sed, jq, grep, cat…) pour lire/charger/découper le
  contenu : si tu dois relire un fichier (vault ou résultat déporté .../tool-results/...), utilise
  l'outil Read ; le découpage et le résumé se font par raisonnement, pas en ligne de commande.
"""
)
```

#### Sous-agent « chat-extractor » (Slack/Teams/… si branché)

```
Agent(
  description="Chat 24h scan",
  prompt="""
Tu es un agent de collecte de messagerie d'équipe. LECTURE SEULE.

TÂCHE : scanner les dernières 24h (ou depuis le dernier passage) pour les signaux pertinents :
1. Mentions directes de toi et DMs des personnes clés.
2. Quelques canaux prioritaires (🔧 à définir selon ton orga — 15-30 derniers messages).

EXTRAIRE un résumé structuré (~500 tokens max), regroupé par THÈME (pas par canal) :

## Signaux chat (24h)
### Mes engagements
### Attentes envers moi
### À escalader        # 🔧 adapte
### À partager         # 🔧 adapte
### Alertes            # incidents, escalades, urgences

THREADS : À LIRE DEUX FOIS, c'est là que cet agent s'est planté sur le terrain.
- L'unité de sens est le THREAD ; l'unité que ta recherche renvoie est le MESSAGE. Un message
  racine, c'est l'instant où la question a été POSÉE, jamais sa résolution. Échec terrain :
  « pas de réponse depuis jeudi » rapporté sur un thread qui avait 12 réponses le jour même,
  bug ouvert et analyse postée.
- Avant de rapporter TOUT message comme un état courant, et systématiquement avant les mots
  « sans réponse », « en attente », « non tranché », « toujours en attente », « personne n'a
  répondu » : OUVRIR SON THREAD.
- Un nombre de réponses non nul avec le thread non lu interdit tous ces mots.
- Si ton connecteur n'expose pas les compteurs de réponses, le dire dans ton retour ; ne pas
  lire son silence comme « pas de réponses ».
- Trier par ÉTAT, pas par ton : un message qui sonne urgent et qui est déjà traité n'est pas
  urgent.

AFFIRMATIONS NÉGATIVES :
- Écrire « je n'ai pas trouvé X », jamais « il n'y a pas de X ». Une affirmation négative nomme
  la vérification qui l'établit, ou se reformule en question ouverte.
- Marquer 🔴 toute affirmation négative ou comportementale dans ton retour, pour que le contexte
  principal sache qu'elle n'est PAS collable dans un message à un humain. ✅ = observé et cité,
  🟡 = déduit.
- Avant de rendre : relis ta propre récolte. Est-ce que quelque chose que tu as récupéré
  CONTREDIT ce que tu t'apprêtes à affirmer ? (Un échec réel a affirmé « pas de réponse » alors
  que le même jeu de résultats contenait un message plus tardif remerciant l'auteur pour sa
  réponse complète.)

RÈGLES :
- Ignorer le conversationnel pur (bonjour/merci/emoji) et les bots/notifications.
- Backlinks via vault/people/ (jamais de prénom seul).
- JAMAIS de shell (python3 -c, node -e, awk, sed, jq, grep, cat…) pour lire/charger/découper le
  contenu : si tu dois relire un fichier (vault ou résultat déporté .../tool-results/...), utilise
  l'outil Read ; le découpage et le résumé se font par raisonnement, pas en ligne de commande.
"""
)
```

#### Sous-agent « my-actions » (ce que TU as fait)

```
Agent(
  description="Mes actions depuis le dernier passage",
  prompt="""
Tu es un agent de collecte de TES actions. LECTURE SEULE.

TÂCHE : trouver les messages/décisions émis PAR TOI depuis <DATE_DERNIER_PASSAGE>, et ne garder
que les ACTIONS significatives (annonces, décisions, cadrages, validations, escalades).
IGNORER : "ok", "merci", "je regarde", réactions, logistique.

EXTRAIRE (~500 tokens max), une ligne par action :
- [YYYY-MM-DD] <action courte> — #canal [[people/destinataire-principal]]

RÈGLES :
- CHAQUE action = UN message distinct (ne pas fusionner).
- Lire le contenu avant de résumer (ne pas deviner d'après le canal).
- Max ~15 actions ; au-delà, garder les plus structurantes.
- JAMAIS de shell (python3 -c, node -e, awk, sed, jq, grep, cat…) pour lire/charger/découper le
  contenu : si tu dois relire un fichier (vault ou résultat déporté .../tool-results/...), utilise
  l'outil Read ; le découpage et le résumé se font par raisonnement, pas en ligne de commande.
"""
)
```

### Étape 3 — Synthèse (contexte principal)

Le contexte principal reçoit les résumés compacts de tous les sous-agents + l'agenda
(~3-5k tokens). **Trier et croiser** : un même sujet vu dans un transcript ET dans le chat = signal
fort. C'est aussi ici qu'on décide si le delta **amende la réponse en cours** (Phase 3 du flux).

**Réconcilier avant d'écrire la moindre ligne** (voir *Discipline d'affirmation* plus haut). Les
retours forment un corpus à rendre cohérent avec lui-même, **pas** un sac de citations pour étayer
une synthèse déjà décidée. Deux passes, les deux peu coûteuses :

1. **Est-ce que quelque chose que j'ai récupéré contredit ce que je m'apprête à affirmer ?** Une
   contradiction dans ton propre matériau l'emporte sur l'affirmation, toujours.
2. **Chaque ligne 🔴 est soit vérifiée maintenant, soit reformulée en question ouverte.** Un 🔴 qui
   atteint le briefing tel quel, c'est celui que la personne va coller dans un canal.

Un sous-agent qui a signalé ne pas voir les compteurs de réponses t'a dit que son silence n'est
**pas mesuré** : le porter jusqu'au briefing, au lieu de l'arrondir en « il ne s'est rien passé ».

### Étape 4 — Écriture du briefing (si briefing du matin)

Écrire dans `vault/briefings/YYYY-MM-DD.md` :

```markdown
---
type: briefing
date: YYYY-MM-DD
architecture: fan-out/fan-in
sources: ["[[raw-sources/transcripts/...]]", "chat (24h)", "calendar (jour)"]
unverified: true          # vrai tant qu'un caveat ci-dessous reste décoché (voir Caveats)
tags: [briefing]
---

# Briefing — YYYY-MM-DD

## Ce que tu as fait depuis le dernier briefing
- [YYYY-MM-DD] [action] — #canal [[people/destinataire]]

## Tes engagements (ce que tu as promis)
- **[engagement]** : contexte, source [[raw-sources/...]]

## Ce qu'on attend de toi
- Échéance du jour : [ce qui tombe, et le message qui le dit]
- ✅ [[people/prenom-nom]] a demandé X le [date], thread résolu, toujours ouvert
- 🔴 Je n'ai pas trouvé de réponse de [[people/prenom-nom]] sur X, **thread non lu** : ne pas le
  répéter à voix haute, demander plutôt « où en est-on sur X ? »

## À escalader / À partager   # 🔧 sections à adapter à ton organisation

## Agenda du jour
| Heure | Réunion | Préparation |
|---|---|---|
| HH:MM | **[réunion]** | [contexte/action] |

## Caveats : des DETTES, pas des faits. Re-vérifier avant réemploi, ne jamais hériter comme établi.
- [ ] 🔴 [ce qui n'est pas vérifié] : la vérification qui trancherait, [la nommer]
- [ ] 🟡 [ce qui a été déduit plutôt qu'observé, et à partir de quoi]
```

**Lire cette dernière section attentivement, ce n'est pas de la décoration.** Ce sont les lignes
qu'une session future va retrouver et, si elles sont en prose, promouvoir silencieusement en
prémisses : c'est exactement comme ça que le second échec a commencé. Donc une **case à cocher** par
dette (visible par la machine, greppable, cochable quand c'est réglé) et `unverified: true` dans le
frontmatter tant qu'une seule reste décochée. Retirer la clé quand elles sont toutes réglées, et
seulement là.

Les marqueurs sont **obligatoires** sur toute affirmation concernant une personne : ✅ observé et
cité, 🟡 déduit, 🔴 négatif ou comportemental non vérifié, **jamais** collable dans un message à un
humain. (Ce sont des marqueurs de *confiance*, pas de priorité : ne pas les recycler en code couleur
d'urgence, sinon le seul signal qui protège une relation se perd dans la décoration.)

Pas de section vide, l'omettre. Chaque signal cite sa source (crochets ou backlink).

### Étape 5 — Append dans `vault/actions-log.md`

Le ledger est un **artefact de première classe, initialisé (seedé)** : il est créé à l'installation
et re-seedé (s'il venait à manquer) au démarrage de session par le hook `session-actions-log`, donc
il existe normalement déjà - il suffit d'**appender** une ligne plate et *grep-able* par action sous
son en-tête (le créer quand même s'il est absent) :

```markdown
## [YYYY-MM-DD] <action> — #canal [[people/destinataire]]
```

**Append-only** : ne jamais réécrire les lignes existantes ni l'en-tête seedé. Usage : « qu'est-ce
que j'ai fait sur X ? » → `grep -i "X" vault/actions-log.md` puis enrichissement via les briefings
référencés.

## Mode re-exécution (même jour)

Si `vault/briefings/YYYY-MM-DD.md` existe déjà : le relire, re-scanner les sources, et n'ajouter
qu'une section `## 🔄 Mise à jour HH:MM` en tête s'il y a du nouveau. Sinon afficher
« Pas de nouveauté » sans modifier le fichier.

**Relire un briefing, c'est lire une SOURCE, pas récolter des faits**, et ça vaut aussi pour celui
d'hier et pour toute note que ce cerveau a écrite sur lui-même. Ses caveats décochés sont des
**dettes dont tu viens d'hériter** : les régler, ou les reporter en tant que dettes, et ne cocher une
case que quand une vérification l'a vraiment levée. Un caveat qui perd sa case en silence a été
blanchi en fait.

## Conventions backlinks

| Contexte | Syntaxe |
|---|---|
| Personne | `[[people/prenom-nom]]` (kebab-case, sans accents) |
| Transcript | `[[raw-sources/transcripts/YYYY-MM-DD-slug]]` |
| Topic | `[[topics/nom-topic]]` |
| Briefing antérieur | `[[briefings/YYYY-MM-DD]]` |

## Critère de succès

En < 1 minute de lecture, tu sais (a) ce que tu dois faire aujourd'hui et (b) ce que tu dois
pousser vers les autres — zéro signal important perdu depuis le dernier passage.
