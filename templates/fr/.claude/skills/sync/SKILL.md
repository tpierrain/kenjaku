---
name: sync
description: "Synchronise le repo git entre machines en cours de session. Commit les changements locaux, pull --rebase depuis origin, gère les conflits interactivement (l'univers actif a une règle permanente : la machine devant laquelle tu es assis·e gagne), annonce un contexte arrivé avec le pull, et push."
version: 1.1.0
---

# /sync — Synchronisation repo inter-machines

> Commande utilisateur. Utile quand on travaille sur plusieurs machines (laptop perso / pro)
> et qu'on veut récupérer les changements pushés depuis l'autre sans quitter la session.

## Quand l'utiliser

- Quand on a travaillé sur une autre machine et qu'on veut récupérer les changements ici.
- En milieu de session, sans avoir à quitter et relancer Claude Code.
- Complète le hook `SessionStart` (qui fait un pull au démarrage) pour les cas mid-session.

> ℹ️ Nécessite un **remote git configuré** (`origin`). En usage purement local, ce skill est inutile.

## Procédure

### Étape 1 — État local
```bash
git status --porcelain
```
**Clean** → passer à l'étape 3. **Dirty** → étape 2.

### Étape 2 — Commit des changements locaux
```bash
git add .
git commit -m "auto: vault/claude sync"
```
Crée un point de retour sûr avant le rebase.

### Étape 3 — Fetch et rebase
```bash
node scripts/set-active-universe.mjs current   # le mémoriser : l'étape 5 compare
git fetch origin
git rebase origin/$(git branch --show-current)
```
**Succès** → résumé + étape 5. **Conflit** → étape 4.

> Lire l'univers actif **avant** de rebaser. Le pull peut transporter un changement de contexte
> fait sur l'autre machine du propriétaire (c'est un état versionné, ADR 0034), et l'étape 5 ne
> peut le dire qu'en comparant. Au démarrage de session, la même chose est traitée de façon
> déterministe par un hook ; en cours de session, ce skill est le seul canal.

### Étape 4 — Gestion des conflits
1. Lister les fichiers en conflit : `git diff --name-only --diff-filter=U`
2. Afficher le diff de chacun avec contexte.
3. Demander à l'utilisateur :
   > **Conflit sur N fichier(s).** Options :
   > - **merge** : je résous et on continue le rebase
   > - **abort** : `git rebase --abort` — retour à l'état d'avant (le commit local est safe)
4. Si **merge** : résoudre intelligemment (contenu vault = souvent append-only → garder les deux versions), `git add` les fichiers résolus, `git rebase --continue`.
5. Si **abort** : `git rebase --abort`, signaler que le commit local est intact, stop.

#### Le seul fichier avec une règle permanente : `.vault-rag/active-universe`

Il contient l'univers (le contexte) dans lequel travaille le propriétaire. C'est une **valeur
unique**, donc « garder les deux » n'a aucun sens, et improviser ici change silencieusement la
portée de toutes les recherches pour le reste de la session. La règle, tranchée une fois :

> **La machine devant laquelle tu es assis·e gagne.** On garde la valeur courante de cette
> machine ; le prochain `/switch` du propriétaire la propagera partout.

```bash
git checkout --theirs -- .vault-rag/active-universe && git add .vault-rag/active-universe
```

⚠️ **`--theirs` est le bon, et c'est le contre-intuitif.** Un rebase rejoue TES commits par-dessus
ceux d'origin : pendant le conflit, `--ours` désigne donc **origin** (l'autre machine) et
`--theirs` **le commit de cette machine**, celui qui est en train d'être rejoué. Ne « corrige »
pas ça en `--ours` : ce serait confier la session au contexte de l'autre laptop, exactement ce que
la règle refuse. Résous, puis `git rebase --continue`, et laisse l'étape 5 l'annoncer.

### Étape 5 — Push et résumé
```bash
git push
node scripts/set-active-universe.mjs current   # comparer avec ce qu'a lu l'étape 3
```
Afficher : commit local oui/non, fichiers récupérés depuis l'autre machine, statut du push.

**Si l'univers a changé**, le dire en UNE ligne, en premier, dans la langue du propriétaire : un
changement de portée que personne n'annonce, c'est précisément l'échec que cette fonctionnalité
existe pour supprimer.

> Tu es maintenant dans ton univers **`<nom>`** (il t'a suivi·e depuis ton autre ordinateur).
> Les recherches sont limitées à cet univers, plus tes notes transverses.

S'il n'a pas changé, ne rien dire du tout sur les univers : un cerveau mono-contexte ne doit jamais
entendre parler de la fonctionnalité (divulgation progressive, ADR 0034).

## Cas limites
- **Rien à sync** : repo clean + à jour → « Rien à synchroniser (commit abc1234). »
- **Réseau indisponible** : `git fetch` échoue → signaler, changements locaux intacts.
- **Conflit complexe** (binaires, restructuration) : recommander une résolution manuelle.
