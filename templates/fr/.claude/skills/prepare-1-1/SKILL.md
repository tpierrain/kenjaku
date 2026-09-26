---
name: prepare-1-1
description: "Prépare un 1-1 avec n'importe qui, dans les deux sens : avec TON manager (les sujets que tu veux porter, ce qui a bougé depuis la dernière fois) ou avec quelqu'un que TU manages (engagements pris/confiés, sujets opérationnels, revue de KPI). Prend un nom/alias, croise la fiche de la personne, le dernier 1-1 et le delta de signaux récents (via sync-sources, LECTURE SEULE). Skill méta : une structure qui te donne des idées, à affiner à tes axes et tes KPI (au besoin avec /improve)."
version: 1.0.0
---

# /prepare-1-1 — Préparer un 1-1 (version méta)

Produit un **briefing dont la première page est la prépa entière** : la page depuis laquelle tu
parles à ton prochain 1-1, avec les preuves pliées en dessous. C'est une **skill méta** :
elle pose une **structure** qui te donne des idées ; tu l'**affines** ensuite à tes propres axes,
à tes KPI et à ta façon de mener tes 1-1 (édite ce fichier, ou demande à `/improve` de t'aider).

## Paramètre

Un **nom ou alias** de personne dans `$ARGUMENTS` (ex. `/prepare-1-1 jane`). Sert à retrouver
`vault/people/<prenom-nom>.md` (kebab-case, sans accents) et le cache `vault/backlog/<nom>.md`.
Si aucune fiche ne correspond, proposer les fiches proches de `vault/people/` et s'arrêter.

## Contrainte absolue

**LECTURE SEULE.** Ne jamais envoyer de message, mail ou réaction, ne jamais poster nulle part.
Produire uniquement un fichier markdown local dans le vault.

## Étape 0 — Sens du 1-1 (détermine la structure de sortie)

Deux cas, selon ta relation avec la personne (déduis-le de son rôle dans `vault/people/<nom>.md` ;
en cas de doute, demande) :

- **A · 1-1 avec TON manager** (tu es le/la managé·e) → structure « **ce que je veux porter** ».
- **B · 1-1 avec quelqu'un que TU manages** (report, ou pair que tu coaches) → structure
  « **suivi + opérationnel + KPI** ».

## Étape 1 — Collecte (fan-out, LECTURE SEULE)

En parallèle (architecture de [`sync-sources`](../sync-sources/SKILL.md), résumés ~500 tokens) :

- **Cache backlog** : `vault/backlog/<nom>.md` — actions ouvertes / récurrentes (un point demandé
  2+ fois sans clôture est prioritaire).
- **Dernier 1-1** : la note dans `vault/meetings/` (ou via ton connecteur Calendar) — transcript lu
  par un sous-agent isolé (jamais de transcript brut dans le contexte principal). Noter aussi le
  **prochain** 1-1 (date du fichier de sortie ; sinon date du jour).
- **Delta depuis le dernier 1-1** : messagerie, mail, réunions partagées — selon tes connecteurs.

## Discipline d'affirmation

**Les règles complètes vivent à un seul endroit, [`sync-sources` § Discipline d'affirmation](../sync-sources/SKILL.md#discipline-daffirmation),
et cette skill leur obéit au lieu d'écrire les siennes.** Deux paraphrases, ce sont deux disciplines ;
le contrôle appartient là où les faits sont produits, et cette skill consomme ce fan-out.

Va les lire là-bas. Ce qui fait d'une prep de 1-1 le **pire** endroit où les enfreindre :

- **Tu vas dire ces lignes à la personne qu'elles concernent.** Un briefing faux se corrige plus
  tard ; une prep de 1-1 fausse se prononce à voix haute, en face.
- **« Pas fait » est une affirmation comportementale.** La section de suivi des engagements ci-dessous
  invite `tenu / en cours / pas fait` : le troisième est une accusation tant que la vérification qui
  l'établit n'est pas nommée. Écrire « je n'ai pas trouvé de trace de X » et marquer 🔴, ou le poser
  en question ouverte.
- **Le thread, encore.** Avant d'écrire que quelqu'un n'a jamais répondu, jamais livré, jamais
  démarré : ouvrir le thread. Un message racine, c'est l'instant où la question a été **posée**. Un
  nombre de réponses non nul avec thread non lu interdit « sans réponse », « en attente »,
  « toujours en attente ».
- **Une absence porte sa portée dans la même phrase, et le mail est dans le périmètre.** « Je n'ai
  trouvé aucune trace dans tes notes ni dans l'outil de chat ; je n'ai pas cherché dans ton mail »,
  jamais un « aucune trace » tout court. Les engagements sur lesquels un 1-1 repose sont justement
  ceux qui voyagent par mail, et une absence énoncée plus large que la recherche qui la fonde, c'est
  comme ça qu'une affirmation vraie disparaît d'une conversation.
- **Réconcilier d'abord.** Est-ce que quelque chose de récupéré contredit ce que tu t'apprêtes à
  écrire ? C'est cette skill qui a produit le défaut terrain qui le prouve : elle a annoncé un
  changement de rôle comme « non confirmé » alors que la fiche `people/` du vault l'enregistrait
  **confirmé deux mois plus tôt**.

Les marqueurs sont obligatoires ici aussi : ✅ observé et cité, 🟡 déduit, 🔴 négatif ou
comportemental non vérifié, et un 🔴 n'est **jamais** sûr à dire à voix haute dans la réunion.

## Discipline d'identité

**Même dispositif, même raison : [`sync-sources` § Discipline d'identité](../sync-sources/SKILL.md#discipline-didentité)
porte les règles, cette skill leur obéit.** Résoudre contre le vault avant d'écrire une personne, ne
jamais inventer la moitié manquante d'un nom, et interroger le vault avant de qualifier quoi que ce
soit de nouveau. Va les lire là-bas.

Une prep de 1-1 est l'endroit où se tromper coûte le plus cher : chaque personne du fichier est
**l'une des deux personnes présentes dans la pièce**. Se tromper de nom de famille, de titre ou de
lien hiérarchique, ce n'est pas un backlink cassé ici : c'est dit en face, ou dit à son manager.

## La forme de la sortie

**La forme vit à un seul endroit, [`brief-shape`](../brief-shape/SKILL.md), et cette skill lui obéit
au lieu d'écrire la sienne.** Charge-la avant d'écrire une ligne. Même dispositif que la discipline
d'affirmation ci-dessus, même raison : une forme paraphrasée ici, ce serait une deuxième forme, et
deux formes divergent.

Ce que ça impose pour une prep de 1-1, c'est-à-dire là où ça compte le plus :

- **La première page EST la prépa** : la poignée de choses que tu vas vraiment dire, en puces à plat,
  entre le titre `#` de la note et son premier titre `##`. C'est la page depuis laquelle tu parles
  avec la personne en face de toi, et elle doit tenir toute seule.
- **Tout ce qui est sous le premier `##`, ce sont des munitions**, à n'ouvrir que si on te challenge,
  si on te conteste ou si on te le demande, chaque élément portant sa citation mot pour mot, sa date
  et le chemin de sa source. Dans cette pièce, une affirmation que tu ne peux pas citer est une
  affirmation que tu ne fais pas.
- **Un vault peu documenté produit une prépa courte, qui le dit.** Le plafond est un maximum, sans
  aucun minimum en dessous, et on ne remplit jamais pour occuper la page. Les chiffres sont dans
  `brief-shape`, pas ici.
- **Les deux modèles ci-dessous sont déjà taillés à cette forme.** Ce qui trônait en haut (le Top 3,
  le tableau de KPI, les signaux faibles, les axes récurrents) est une munition, et c'est passé sous
  la pliure : non pas parce que ça compte moins, mais parce que ça se lit une fois la réunion
  commencée, pas avant d'entrer.

**À quoi on voit que c'est bon** : si on te tend cette page trente secondes avant d'entrer, tu peux
mener la réunion avec la première page seule, sans scroller une seule fois.

## Étape 2 — Écriture du briefing

Écrire dans `vault/prep-1-1/YYYY-MM-DD-prep-1-1-<nom>.md` (date du prochain 1-1 ; créer le dossier
au besoin), selon le cas détecté à l'étape 0.

**Le frontmatter porte `type: prep-1-1`**, et ce n'est pas de la décoration : la forme s'applique à
toute note dont le `type:` commence par `prep-`, donc une prépa qui l'oublie est une prépa que rien
ne vérifie.

⚠️ **Les puces ci-dessous sont un menu, pas une checklist.** Garde celles que le vault soutient
vraiment et **supprime les autres** : une prépa avec trois lignes vraies vaut mieux qu'une prépa de
six dont deux que tu ne dirais pas à voix haute. Le plafond est un maximum, rien ici n'est un quota.

### Cas A — 1-1 avec ton manager (tu portes les sujets)

```markdown
---
type: prep-1-1
created: YYYY-MM-DD
author: <le nom que `git config --get user.name` donne sur CETTE machine>
tags: [prep, 1-1]
---

# Prep 1-1 — [Prénom] (mon manager) — [date]

- **[Sujet à porter]** : [où on en est, en une proposition] → J'attends : [décision / soutien / arbitrage]
- **[Sujet à porter]** : [où on en est] → J'attends : […]
- **[Ce qui a bougé depuis la dernière fois]** : la chose qui mérite d'être remontée, pas la liste.
- **[Ce que je veux clarifier ou obtenir]** : priorité, ressource, feedback sur moi.
- **[Mon engagement en cours]** : tenu / en cours / à risque.
- 🔴 **Pas documenté :** [ce que le vault ne porte pas sur ces sujets]. *(Cette puce uniquement
  quand c'est vrai : elle remplace le remplissage, elle ne s'y ajoute pas.)*

## Munitions : à n'ouvrir que si on te challenge, si on te conteste ou si on te le demande

### [Sujet] : les preuves
- ✅ « [les mots exacts] » : [YYYY-MM-DD] : `[vault/…md, ou le lien vers la source]`

### Mes engagements, en détail
Le statut de chacun, avec ce qui l'établit.

### Contexte complet
Résumé du dernier 1-1, décisions, actions à suivre `| # | Action | Qui | Quand | Statut |`,
verbatims, activité messagerie/mail/réunions avec liens, qualité des sources.

### Ce que le vault ne soutient PAS
Ce qui n'a pas pu être vérifié, et où on a cherché (notes, outil de chat, mail…), pour qu'un négatif
ne soit jamais prononcé sans qu'on sache qu'il n'est pas étayé.
```

### Cas B — 1-1 avec quelqu'un que tu manages (suivi + opérationnel + KPI)

```markdown
---
type: prep-1-1
created: YYYY-MM-DD
author: <le nom que `git config --get user.name` donne sur CETTE machine>
tags: [prep, 1-1]
---

# Prep 1-1 — [Prénom] — [date]

- **[Engagement à suivre]** : [où ça en est] → demander : [la question d'ouverture]
- **[Ce que je veux lui confier]** : [la responsabilité] → demander : [comment il·elle le voit]
- **[Sujet opérationnel chaud]** : [en une proposition] → demander : [la question concrète]
- **[KPI qui a bougé]** : [valeur, tendance] → demander : [ce que je veux comprendre]
- **[Signal faible]** : [tension, surcharge, sujet esquivé], à aborder avec tact.
- 🔴 **Pas documenté :** [ce que le vault ne porte pas]. *(Uniquement quand c'est vrai.)*

## Munitions : à n'ouvrir que si on te challenge, si on te conteste ou si on te le demande

### Suivi des engagements
- **[Action]** : tenu / en cours / 🔴 aucune trace trouvée *(dire où on a cherché)* : ✅ « [les mots
  exacts de l'engagement] » : [YYYY-MM-DD] : `[source]`
(S'appuie sur le backlog `vault/backlog/<nom>.md`, trié par ancienneté.)

### Revue de KPI            # 🔧 À AFFINER : définis TES indicateurs ici
Collecte + revue des métriques qui comptent pour vous. Exemples possibles (à remplacer par les
tiens) : DORA (lead time, fréquence de déploiement, MTTR, change-fail rate), qualité, delivery,
satisfaction, capacity… Pour chaque KPI : valeur / tendance / question à creuser.
| KPI | Valeur / tendance | Question |
|---|---|---|
| [ton KPI] | [↑/↓/→] | [ce que tu veux comprendre] |

### Signaux faibles
Tensions, frustrations, surcharge, sujets esquivés : avec tact, sans langue de bois, chacun avec
l'observation qui l'a produit.

### Axes récurrents          # 🔧 À AFFINER : les 3-5 thèmes que tu suis avec chaque report
| Axe | Signal détecté | Question par défaut |
|---|---|---|
| [ton axe] | [signal ou « aucun »] | [question] |

### Contexte complet
Résumé du dernier 1-1, décisions, actions à suivre `| # | Action | Qui | Quand | Statut |`,
verbatims, activité messagerie/mail/réunions avec liens, qualité des sources.

### Ce que le vault ne soutient PAS
Ce qui n'a pas pu être vérifié, et où on a cherché (notes, outil de chat, mail…), pour qu'un négatif
ne soit jamais prononcé sans qu'on sache qu'il n'est pas étayé.
```

## Étape 3 — Mettre à jour le backlog
Dans `vault/backlog/<nom>.md` : **ajouter** les nouvelles actions, **cocher** celles dont on a la
preuve de réalisation, **mettre à jour** la date `updated:`. Append-only sur les faits déjà consignés.

## Règles de rédaction
- Français, ton direct et ultra-concis ; listes à puces plutôt que paragraphes.
- Ne pas inventer ; signaler une source partielle ou de mauvaise qualité.
- **Au-dessus du premier `##` : des puces et rien d'autre**, pas de sous-titre, pas de tableau, pas
  de lien à aller ouvrir. Un tableau sur la première page, c'est un tableau que tu lis au lieu de
  regarder la personne.
- Pas de section vide — l'omettre (sauf « Revue de KPI » et « Axes récurrents » en cas B, à garder
  comme rappel même vides, puisque ce sont les sections que tu dois t'approprier). Une section de
  munitions omise ne coûte rien ; une puce de première page en moins, c'est une chose de moins à
  dire, et c'est correct quand le vault ne la soutient pas.
- Jamais d'URL nue : `[texte](url)`. Backlinks `[[people/prenom-nom]]` — pas de nom complet, pas de lien : le nom reste en texte simple.

## Affiner cette skill (c'est le but d'une skill méta)
La structure ci-dessus est un **point de départ**. Rends-la tienne : remplace les KPI d'exemple par
les tiens, ajoute/retire des axes récurrents, ajuste les sections au type de 1-1 que tu mènes.
Tu peux le faire à la main (édite ce fichier) ou demander à **`/improve`** de t'accompagner.

## Critère de succès
En < 2 minutes de lecture, tu sais quoi aborder, pourquoi, avec quelle question d'ouverture — et,
côté manager, où en sont les engagements et les KPI qui comptent.
