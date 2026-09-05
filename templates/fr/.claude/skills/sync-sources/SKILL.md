---
name: sync-sources
description: "Architecture fan-out/fan-in pour aspirer le DELTA des sources externes (Slack, Google Drive / transcripts, Calendar, mail…) via des sous-agents parallèles en LECTURE SEULE. Référence technique interne — c'est le moteur de la Phase 2 du flux principal (question → sync sources en background) et d'un éventuel briefing du matin. Pas une commande utilisateur : ce sont tes questions qui déclenchent l'aspiration."
version: 1.2.0
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
s'appuient sur les fiches de `vault/people/`. Forme d'un lien, quand tu as un nom complet :
**kebab-case, sans accents** (`[[people/jane-doe]]`). Le backlink peut pointer vers une page qui
n'existe pas encore (*dangling links* OK) ; ne pas créer les pages cibles.

**Quand tu n'as qu'un prénom, tu n'as pas de lien à écrire** : ni raccourci, ni complété. Voir
« Discipline d'identité » juste en dessous : le nom reste en texte simple. Cette section décrit la
*forme* d'un lien une fois la personne résolue ; elle ne te demande jamais de produire un nom complet
que tu n'as pas.

## Discipline de connecteur

> **Avant que quoi que ce soit que tu dises des données puisse être vrai, encore faut-il qu'elles
> viennent de la bonne organisation.** Les connecteurs natifs sont mono-compte et ne suivent **pas**
> un `/switch` : après un passage d'une sphère à l'autre, Slack est encore authentifié sur le
> workspace que tu as quitté, pendant que la fiche affichée à l'écran déclare le nouveau. Le cerveau
> lit alors les messages d'une organisation et les classe sous le nom d'une autre, en appliquant
> correctement toutes les règles ci-dessous aux données de la mauvaise entreprise. Rien dans le vault
> ne le révélera après coup : la note aura l'air juste.

1. **Un compte déclaré est une affirmation, jamais une observation.** La section
   `## Connector accounts` d'une fiche d'univers est saisie à la main par son propriétaire. Elle dit
   quel workspace cette sphère est *censée* utiliser ; elle ne dit rien de l'endroit où le connecteur
   se trouve réellement en ce moment.
2. **L'observation revient au sous-agent, la vérification à toi.** Les sous-agents lisent des sources
   externes et ne voient jamais le vault : ils ne peuvent donc rien comparer, exactement comme pour le
   contrôle de nouveauté. Le sous-agent chat **rend le workspace sur lequel il était** ; le contexte
   principal est la seule étape à tenir à la fois cette observation et la fiche, donc c'est lui qui
   vérifie.
3. **Ne compare pas les deux chaînes toi-même, lance la vérification.** `acme.slack.com`,
   `https://acme.slack.com/archives/…` et `acme` sont un seul et même workspace, et une alerte levée
   sur un cerveau correctement connecté apprend à son propriétaire à ne plus lire la vérification :
   ```bash
   node scripts/set-universe-profile.mjs --check-slack "<workspace rendu par le sous-agent>"
   ```
   Elle répond en une ligne et **ne sort en non-zéro que sur une divergence**. Ses quatre réponses sont
   quatre situations différentes : concordance, divergence, « je n'ai pas pu savoir », et « cet univers
   ne déclare aucun compte Slack ». Relaie celle que tu as obtenue.
   N'arrondis jamais les trois dernières vers la première.
4. **Une divergence bloque l'écriture.** N'écris pas le matériau récupéré dans le vault, et n'y réponds
   pas comme s'il appartenait à cette sphère. Dis sur quel workspace se trouve le connecteur, nomme
   celui que l'univers déclare, et arrête-toi là : reconnecter Slack est le geste de la personne, pas
   le tien.
5. **Les connecteurs que personne ne peut interroger restent non vérifiés, et le disent.** Slack est le
   seul outil couvert par cette vérification, volontairement : c'est là que l'erreur coûte le plus cher
   et c'est celui qui répond proprement.
   Notion, Drive, le mail et les autres sont **déclarés et non vérifiés** :
   utilisables, mais jamais présentés comme confirmés, et jamais promus discrètement en
   « vérifiés » parce que Slack, lui, est passé.

## Discipline de source

> **Le verbatim est la source. Tout ce qui se trouve au-dessus de lui dans le fichier en a été tiré.**
> Les preneurs de notes automatiques (Gemini, Noota, Fathom, tl;dv, Otter…) ouvrent leur export par un
> résumé et une liste d'actions, exactement dans la forme du livrable qu'on t'a demandé, et placent la
> transcription plus bas dans le *même* fichier. Une session a lu les 140 premières lignes d'un export
> de 110 000 caractères, a écrit à partir de ce qu'elle y trouvait, et a servi une synthèse IA comme
> source alors que le verbatim était vingt écrans plus bas. La règle « verbatim > synthèse humaine >
> synthèse IA » était déjà écrite, et elle n'a pas joué : elle dit comment **classer** les sources
> quand on les cite, jamais quand **s'arrêter et aller lire** la source brute. Celle-ci est donc un
> ordre des opérations, pas un classement.

1. **Un extrait de recherche n'est jamais une source.** Un résultat est un extrait choisi par l'outil,
   et quand le document est un export de preneur de notes, cet extrait est presque toujours *celui du
   résumé* : deux crans plus loin que ce qui a réellement été dit. Avant d'en écrire quoi que ce soit,
   **ouvre le document** et lis ce qu'il cite. Ne sors jamais la liste d'actions du résumé d'un extrait.
2. **Quand un même document contient les deux, lis le verbatim avant de citer quoi que ce soit qui en dérive.**
   Pas après, pour vérifier : avant, parce que le résumé est convaincant, d'apparence complète, et
   déjà rédigé comme ta réponse. Et la liste d'actions du résumé est la liste d'actions du résumé, jamais la liste des décisions :
   elle est produite à partir de la transcription que tu n'as pas encore lue, et c'est là que se logent
   les désaccords (une action attribuée à la mauvaise personne, une date donnée pour arrêtée que la
   réunion a justement refusé d'arrêter).
3. **Une lecture partielle qui s'arrête dans le résumé n'est pas une lecture du document.** Ces exports
   font six chiffres de caractères et tous les outils de lecture tronquent. Si ce qui revient s'arrête
   avant les tours de parole, retournes-y (par le titre `Transcription`, `Transcript`, ou par les tours
   eux-mêmes) plutôt que d'écrire à partir de ce qui tenait dans la fenêtre.
4. **Déclare le palier que tu as réellement lu.** Toute note écrite par le builder porte un champ
   `source` et est refusée sans lui : `verbatim` > `conversation` > `human-summary` > `ai-summary`, et
   la note est estampillée du palier le **plus faible** qu'elle déclare. Nomme le palier que tu as eu
   entre les mains, jamais celui que le document aurait pu te donner. Si l'export ne contient aucun
   verbatim, **dis-le dans la note** et déclare `ai-summary` : une synthèse honnêtement étiquetée est
   utilisable ; une synthèse étiquetée `verbatim` est une fabrication munie d'une citation.
5. **La notice de lecture est un rappel, pas la règle.** Un hook peut te signaler, juste après une
   lecture, que ce qui revient est une synthèse. Il se déclenche sur les signatures qu'il connaît, donc son silence ne vaut pas permission :
   un export qu'il n'a jamais vu reste un export, et les règles 1 à 4 s'appliquent avec ou sans lui.

## Identité de source — ne pas digérer deux fois la même source

> **Deux personnes peuvent partager un même cerveau, et alors le même mail, le même fil, le même
> document est accessible des deux côtés.** Rien, dans une note, n'enregistrait jusqu'ici DE QUEL
> objet elle avait été tirée (les permaliens vivent dans la prose, et la prose n'est pas une clé de
> recherche), donc le deuxième cerveau ne pouvait pas savoir que le premier l'avait déjà lu. Comme
> les notes des zones en ajout seul fusionnent désormais sans demander à personne, un digest en
> double atterrit en silence. Cette règle supprime la cause, pas l'alarme (ADR 0041).

1. **Avant de capturer quoi que ce soit depuis un connecteur, demande au vault s'il le détient déjà.**
   Une seule commande, depuis le dossier du cerveau, avec les champs bruts rendus par le connecteur
   (jamais une clé que tu aurais écrite toi-même) :

   ```bash
   node scripts/known-source.mjs --type slack --channel C0CEQ4R5E --ts 1725283200.001200
   node scripts/known-source.mjs --type mail --from "Facturation <b@example.com>" \
        --date 2026-09-02T16:19:32Z --subject "Votre facture est disponible"
   ```

   **Trois codes de sortie, et le troisième n'est pas une trouvaille** : `0` non détenu (ou
   impossible à savoir) → capture · `1` déjà détenu → la ligne nomme la note · `2` la question
   elle-même est cassée.
   Ne traite jamais un code non nul comme « déjà détenu » : une faute de frappe dans tes propres
   arguments annulerait alors une vraie capture.

2. **« Déjà détenu » veut dire VA LA LIRE, jamais « laisse tomber la question ».** Ouvre la note que
   la vérification a nommée, réponds à partir d'elle, et **enrichis-la** si ce qu'on te demande a
   besoin de quelque chose que le premier passage n'avait pas extrait. C'est toute la valeur d'un
   cerveau partagé. Jeter le travail est la seule lecture de cette règle qui rende le cerveau moins
   bon.

3. **Estampille ce dont tu t'es servi·e.** Toute note écrite à partir d'une source externe porte
   `sources:` dans son frontmatter : une liste inline de clés normalisées.
   **Une capture en liste une** (un mail, un fil, un document, une note).
   **Une synthèse en liste autant qu'elle en a tiré** (un briefing, une fiche de personne, une page
   de sujet) : une telle note n'*a* pas une
   source, elle *s'est appuyée* sur plusieurs. `file-back-note.mjs` compose les clés pour toi à
   partir de `"sourceKeys": [{ "type": …, … }]` (des descripteurs, pas des chaînes).

4. **La table des clés, une ligne par source, et toutes ces valeurs sont gratuites dans la réponse
   ordinaire :**

   | Source | Ce qui l'identifie | Où tu l'as déjà |
   |---|---|---|
   | Slack | l'identifiant du canal + le `ts` du message | toute réponse de message : c'est ce qu'encode un permalien |
   | Agenda | l'identifiant de l'**occurrence**, jamais celui de la série | le listing ordinaire (un événement récurrent rend les deux : prends l'occurrence) |
   | Drive | l'identifiant du fichier | le résultat de recherche |
   | Notion | l'identifiant de la page | le miroir s'y appuie déjà |
   | Mail | l'**adresse de l'expéditeur + l'horodatage d'envoi + le sujet** | `MINIMAL` / `METADATA_ONLY` |

   🛑 **Ne va jamais chercher un message brut juste pour obtenir une identité.** Le `Message-Id` RFC
   demanderait un fetch MIME complet : cent kilo-octets dans ton contexte pour un en-tête, c'est
   exactement ce que ce fan-out existe pour éviter. Les trois champs bon marché sont identiques dans
   toutes les copies d'un mail, quel que soit le transport, et exiger que les trois correspondent est
   exact, pas approximatif.

5. **Pas de clé veut dire INCONNUE, jamais « déjà vue ».** Une conversation, un document qu'un humain
   t'a lu, une source qui n'a pas de ligne ci-dessus : n'écris aucune clé `sources` plutôt qu'une clé
   inventée. Toutes les notes écrites avant cette règle sont dans cet état, et un cerveau qui lirait
   « pas de clé » comme « déjà vue » se croirait au courant du monde entier.

6. **L'identité n'est jamais une raison d'en dire moins.** Si la vérification dit « détenu » et que
   ta question a besoin de plus que ce que dit la note détenue, dis-le et va plus loin.
   Cette règle supprime le STOCKAGE en double, pas la réflexion en double.

## Discipline d'identité

> **Lis le vault avant d'écrire sur les personnes qui s'y trouvent.** Un briefing a un jour transformé
> le « Jérémy (front Candor) » de la source en « Jérémy Hinard », un nom de famille qui n'existe nulle
> part ailleurs que dans cette note. La résolution suivante se fait alors contre la fabrication.

1. **Résous avant d'écrire.** Avant de nommer une personne dans une note, lis ce que le vault en dit
   déjà : les fiches `people/` (celles de l'univers actif **et** celles, transverses, de la racine) et
   les notes d'organisation. Le vault prime sur ta mémoire de la session comme sur le raccourci de la
   source.
2. **N'invente jamais la moitié manquante d'une identité.** Un prénom sans nom de famille **reste un
   prénom** : écris-le en texte simple, jamais en `[[people/…]]`, et ne le complète jamais avec un nom
   que la source ne t'a pas donné. « Jérémy (front Candor) » s'écrit « Jérémy (front Candor) ». Perdre
   un backlink coûte un clic ; une identité fabriquée est définitive, elle est indexée, et elle devient
   ce contre quoi la résolution suivante se résout.
3. **Interroge le vault avant de qualifier quoi que ce soit de nouveau.** Un fait n'est *nouveau* que
   par rapport à ce que le vault contient déjà : lance un `search_vault` dessus avant de le présenter
   comme une nouveauté, et lis ce qui revient. Un briefing a un jour republié comme un scoop un fait
   vieux de deux mois, et écrit « Hossam, qui deviendrait CTO Visma France (non confirmé) » alors que
   `people/hossam-laanait.md` disait déjà « CTO Visma France (confirmé 04/06) » : un enregistrement
   daté rétrogradé en rumeur. La réponse du vault prime ; si tu la contredis, dis-le et dis sur quoi.
4. **Un lien n'est pas une personne.** Ne crée jamais une fiche `people/` dans le seul but de
   satisfaire un lien `[[people/…]]` entrant. Un lien cassé est un défaut *du lien* : répare-le là où
   il a été écrit (corrige l'orthographe, pointe la fiche qui existe vraiment, ou supprime-le). Créer
   la cible, à l'inverse, promeut une mauvaise résolution en réponse du vault à la question *qui
   existe*, et la résolution suivante se fait alors contre elle. `people/stephanie-music.md` est née
   exactement comme ça, d'un seul lien mal résolu ; ce nom n'apparaît qu'une fois dans tout le vault :
   dans son propre titre. Une fiche s'écrit quand quelqu'un confirme la personne, jamais pour faire
   passer au vert un rapport de liens.
5. **Dis de qui il s'agit.** Un prénom est rarement unique : le vault pour lequel cette discipline a
   été écrite contenait trois Romain, trois Marie, deux Karim, deux Caroline et deux Michael. Une
   fiche `people/` porte donc un **bloc d'homonymie** : une ligne, sous le titre, qui dit ce qui
   distingue cette personne de toutes celles que le vault connaît sous ce prénom (son rôle, son
   organisation, et les autres fiches nommées). Sans lui, la fiche ne résout rien : elle déplace
   l'ambiguïté d'un cran, à l'intérieur du vault. Le builder l'impose :
   `scripts/file-back-note.mjs` refuse une nouvelle personne dont le vault porte déjà le prénom tant
   que la spec ne contient pas `distinguish`, et son refus nomme les homonymes trouvés. L'autre
   moitié, à la lecture, est ce qui rend le bloc utile : quand un prénom seul correspond à plusieurs
   fiches et que rien dans la source ne les départage, ce nom est **non résolu** (la règle 2
   s'applique : texte simple, pas de lien). Ne résous jamais vers la fiche la plus proche, ni vers
   celle que tu viens de lire.
6. **Dis à quel point c'est sûr.** Conforme ne veut pas dire vrai. Le builder donne à chaque fiche le
   même frontmatter propre et le même `/lint` au vert : un nom lu sur un organigramme et un nom déduit
   d'un surnom en ressortent identiques, et le vault lit ensuite les deux comme sa propre réponse à
   « qui existe ». Une fiche `people/` porte donc un **bloc de confiance** : ce sur quoi cette identité
   repose, dans l'échelle que la discipline d'affirmation utilise déjà plus bas
   (✅ observé · 🟡 déduit ou probable · 🔴 non vérifié), jamais une seconde. Le builder l'impose :
   `scripts/file-back-note.mjs` refuse une nouvelle fiche personne tant que la spec ne contient pas
   `confidence` : un niveau, et la **base** sur laquelle il repose (la source, sa date, la fiche
   trouvée). Réponds honnêtement plutôt que de choisir le niveau qui débloque l'écriture :
   `unverified`, écrit noir sur blanc, ne coûte rien et c'est exactement ce que la passe suivante a
   besoin de savoir. Et l'autre moitié, à la lecture, est ce qui rend le bloc utile : une fiche
   marquée 🟡 ou 🔴 est une **piste, pas la réponse du vault** : revérifie-la avant de résoudre quoi
   que ce soit contre elle, et ne la laisse jamais devenir un acquis au seul motif qu'elle est écrite
   depuis un moment. C'est le « le bémol d'hier est une dette » de la discipline d'affirmation,
   appliqué aux fiches du vault lui-même.

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
0. Avant de stocker quoi que ce soit, lance la vérification d'identité de source depuis le
   dossier du cerveau : `node scripts/known-source.mjs --type drive --file <DOC_ID>`.
   Code 1 = ce cerveau a déjà capturé ce document : rends la note qu'il nomme, avec ce dont ta
   question avait besoin, au lieu de le capturer une deuxième fois.
1. Lire le document <DOC_ID> via ton connecteur Drive (mcp__<drive>__read_file).
2. Sauvegarder le contenu brut dans vault/raw-sources/transcripts/YYYY-MM-DD-<slug>.md
   avec ce frontmatter :
   ---
   type: transcript
   source: <connecteur>
   sources: ["drive|<DOC_ID>"]
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
- Backlinks via vault/people/ (kebab-case, sans accents). Pas de nom complet, pas de lien : le nom reste en texte simple.
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

SUR QUEL WORKSPACE TU ÉTAIS — rends-le, ce n'est pas optionnel :
- Termine ta récolte par une ligne : `WORKSPACE: <ce que tu as réellement vu>` — un hôte de
  permalien (https://<workspace>.slack.com/...), le champ workspace/team, ce que portent tes
  résultats.
- Si rien dans tes résultats ne le nomme, rends `WORKSPACE: unknown`. Ne le devine JAMAIS à
  partir des noms de canaux ni du sujet des conversations.
- Tu ne peux pas le vérifier toi-même : tu ne vois jamais le vault. C'est le contexte principal
  qui le compare à ce que cet univers déclare : le connecteur est mono-compte et ne suit PAS un
  changement d'univers, il peut donc être authentifié sur une tout autre organisation.

RÈGLES :
- Avant de stocker quoi que ce soit, lance la vérification d'identité de source (voir § Identité
  de source) : `node scripts/known-source.mjs --type slack --channel <id canal> --ts <ts message>`.
  Code 1 = déjà détenu : rends la note qu'il nomme au lieu de la recapturer.
- Ignorer le conversationnel pur (bonjour/merci/emoji) et les bots/notifications.
- Backlinks via vault/people/ (kebab-case, sans accents). Pas de nom complet, pas de lien : le nom reste en texte simple.
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
une synthèse déjà décidée. Quatre passes, toutes peu coûteuses :

1. **Est-ce que quelque chose que j'ai récupéré contredit ce que je m'apprête à affirmer ?** Une
   contradiction dans ton propre matériau l'emporte sur l'affirmation, toujours.
2. **Chaque ligne 🔴 est soit vérifiée maintenant, soit reformulée en question ouverte.** Un 🔴 qui
   atteint le briefing tel quel, c'est celui que la personne va coller dans un canal.
3. **Tout ce que je m'apprête à présenter comme nouveau, et chaque personne que je m'apprête à
   nommer, passe d'abord par un `search_vault`.** Tu es la seule étape à tenir à la fois le delta et
   le vault : les sous-agents lisent des sources externes et ne le voient jamais. Ce qui revient
   l'emporte sur le cadrage du delta (voir *Discipline d'identité* plus haut) : c'est ainsi qu'un
   fait vieux de deux mois cesse d'être republié comme un scoop, et qu'une fiche « (confirmé 04/06) »
   cesse d'être rétrogradée en « (non confirmé) ».

4. **La ligne `WORKSPACE:` rendue par le sous-agent chat est vérifiée, avant d'en écrire quoi que ce
   soit.** Lance `node scripts/set-universe-profile.mjs --check-slack "<ce workspace>"` (voir
   *Discipline de connecteur* plus haut). Tu es la seule étape à tenir à la fois l'observation du
   sous-agent et la fiche qui déclare ce que cette sphère devrait utiliser. **Une divergence arrête
   l'écriture** : le matériau appartient à une autre organisation, et c'est une fuite inter-univers
   que rien en aval ne peut détecter, la note aura l'air parfaitement bien formée.

Un sous-agent qui a signalé ne pas voir les compteurs de réponses t'a dit que son silence n'est
**pas mesuré** : le porter jusqu'au briefing, au lieu de l'arrondir en « il ne s'est rien passé ».

### Étape 4 — Écriture du briefing (si briefing du matin)

**Demande le chemin, ne le compose pas** : deux personnes sur un même cerveau écrivent deux briefings
pour le même jour, et le second ne doit pas atterrir sur le premier.

```bash
node scripts/dated-note-path.mjs --folder briefings --date YYYY-MM-DD
```

Il répond `vault/briefings/YYYY-MM-DD.md` sur un cerveau à un·e seul·e auteur·rice (rien ne change
pour toi), et un chemin par personne dès que quelqu'un d'autre a déjà écrit ce jour-là. Même commande
pour `--folder daily`.

Écrire dans le chemin qu'il a rendu :

```markdown
---
type: briefing
date: YYYY-MM-DD
author: <le nom affiché par la commande ci-dessus>   # qui l'a écrit ; absent = inconnu, jamais personne
architecture: fan-out/fan-in
sources: ["drive|<id>", "slack|<canal>|<ts>"]   # ce dont ce briefing S'EST SERVI, clés normalisées
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

**Le champ `sources:` est désormais la liste machine** (voir *Identité de source* plus haut) : les
clés normalisées de ce dont ce briefing s'est servi, pour qu'un autre cerveau qui croise le même
document sache que celui-ci l'a déjà digéré. La liste **humaine** des sources reste dans le corps, là
où un lecteur ou une lectrice la trouve déjà, sous forme de backlinks. Les anciens briefings dont le
`sources:` contient de la prose ne risquent rien : une entrée en prose ne peut jamais être égale à
une clé normalisée, donc elle ne peut jamais produire un faux « déjà détenu ».

### Étape 5 — Append dans `vault/actions-log.md`

Le ledger est un **artefact de première classe, initialisé (seedé)** : il est créé à l'installation
et re-seedé (s'il venait à manquer) au démarrage de session par le hook `session-actions-log`, donc
il existe normalement déjà - il suffit d'**appender** une ligne plate et *grep-able* par action sous
son en-tête (le créer quand même s'il est absent) :

```markdown
## [YYYY-MM-DD] <action> — #canal [[people/destinataire]] · <qui>
```

Le dernier champ, c'est **qui l'a fait** (`git config --get user.name`, le même nom que tout le reste
de ce cerveau donne à la question « qui ? »). Ça compte le jour où le cerveau est partagé : deux
personnes qui appendent dans un même ledger voient leurs lignes conservées côte à côte, et sans nom
le résultat se lit comme l'histoire d'une seule personne.

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
