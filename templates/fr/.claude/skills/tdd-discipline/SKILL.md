---
name: tdd-discipline
description: "Discipline TDD universelle — baby-steps (un seul test à la fois, red→green→refactor complet à chaque pas, PAS de test-first batch), s'assurer que le test échoue d'abord (fail-first), triangulation, refactor jamais optionnel, plus la qualité des assertions (leçons du mutation testing). Agnostique langage, pour TOUT code (libs, tools, helpers, algos, services). À charger dès qu'on écrit ou modifie du code en TDD."
version: 1.1.0
origin: use-case-driven-harness
---

# Discipline TDD (universelle)

> Skill vendorée depuis le harnais `use-case-driven-harness` (re-sync **manuel**, dernier le
> **2026-07-27**). Volontairement réduite au **socle universel** : les déclinaisons spécialisées
> (archi back-end, conventions par langage) vivent dans le harnais source, hors périmètre de ce
> générateur. **Dater cette ligne à chaque re-sync** : sans ça la dérive est invisible, ce qui est
> exactement ainsi que les leçons de mutation testing ci-dessous sont restées deux jours dans le
> harnais source sans atteindre cette copie.

La discipline TDD de base, **agnostique langage**, qui s'applique à **tout type de code** :
petites libs, simples tools, helpers, algorithmes isolés comme services et applications.
Dans ce repo, elle régit **tout le code** sans exception : le moteur RAG (`rag/`) **comme** le
harnais d'installation (`installer.mjs` et ses helpers `scripts/lib/*.mjs`) — tous testés via
`node --test`. Pas seulement le moteur.

## Baby steps, PAS test-first batch

**Un seul test à la fois.** Cycle 🔴 red → 🟢 green → ♻️ refactor **complet pour chaque test**, avant d'écrire le test suivant.

- **Interdit** : écrire plusieurs tests d'avance puis implémenter pour tous les faire passer. C'est du *test-first batch*, pas du TDD.
- **Pourquoi** : écrire les tests en lot fige le design en amont (l'API est décrétée avant la moindre ligne d'implémentation) et **tue le design émergent**. En baby steps, chaque test tire le strict minimum de code et la structure se découvre incrément par incrément.
- **En pratique** : test 1 → red → plus petit code qui passe → refactor → test 2 → red → … Chaque pas est le plus petit qui fasse passer le test courant.
- **Le refactor n'est jamais optionnel.** Le pas n'est *terminé* qu'après le ♻️. Il porte **d'abord sur le code d'implémentation** : meilleure structure, mêmes comportements — un refactor **ne change jamais le contrat public** (c'est sa définition : behavior-preserving). Sur les tests, il se limite à les rendre **plus lisibles** (noms, helpers, intention) — **jamais** à affaiblir leurs assertions ni à leur faire vérifier moins de choses. Si un test couvre mal, c'est un *nouveau* test, pas un refactor. Même sans rien à nettoyer, on passe consciemment par l'étape et on le constate (« refactor : RAS »). Sauter le refactor « parce que ça marche » accumule de la dette à chaque cycle — c'est exactement ce que la discipline baby-steps est censée empêcher.

## S'assurer que le test échoue d'abord (fail-first)

Avant d'écrire la moindre ligne d'implémentation, **vérifier que le nouveau test échoue
pour la bonne raison** (assertion non satisfaite, pas une erreur de compilation accidentelle
ou un test qui ne s'exécute même pas). Un test qui passe avant qu'on ait codé ne prouve rien :
il faut le voir 🔴 *rouge* d'abord, puis le rendre 🟢 *vert*. C'est la garantie que le test
teste réellement quelque chose.

## Triangulation

Quand le comportement attendu n'est pas évident, on **triangule** : on n'introduit de la
généralisation dans l'implémentation que lorsqu'**au moins deux exemples** (deux tests) la
réclament. Le premier test peut être satisfait par une réponse « en dur » ; le deuxième,
différent, force à dégager la vraie logique. On évite ainsi de sur-généraliser trop tôt — la
généralité émerge des exemples, elle n'est pas décrétée.

## Asserter sur le comportement, jamais sur des strings d'affichage

Les assertions (et les setups de test) ne doivent **pas dépendre du texte** d'un message
d'erreur, d'un log ou d'une sortie console (ex. `assert(!/PUSH ÉCHOUÉ/.test(stdout))`).

- **Pourquoi** : un message change pour mille raisons (refacto, i18n, ponctuation) sans que le
  comportement bouge → le test casse à tort, ou pire passe à tort. **Le message n'est pas le
  contrat.**
- **En pratique** : asserter sur l'**état/comportement réel observable**. Exemples : pour « le
  hook auto-commit n'a pas poussé », vérifier qu'un dépôt bare servant de remote n'a **reçu aucun
  commit** (`git --git-dir … rev-list --count HEAD`) plutôt que l'absence d'un message d'échec ;
  pour une décision, tester une **fonction pure** qui renvoie des données plutôt que le log du script.

> **Ceci ne contredit pas la règle 1 ci-dessous.** *Ce* qu'on asserte, c'est l'état observable, jamais
> la prose. Mais *quand* on asserte une exception, il faut la cerner : un `throws` nu accepte n'importe
> quel échec, y compris un que le code ne devrait jamais produire.

## Qualité des assertions : leçons du mutation testing

Un audit de mutation (2026-07, trois packages) a montré que des tests **verts** laissaient survivre
des mutants : le comportement était « couvert » mais les **assertions étaient trop lâches**. Six
réflexes, à appliquer systématiquement, chacun aurait **empêché** le survivant :

1. **Asserter le message, pas le fait.** `throws`/`rejects` **toujours** avec un matcher (regex/type),
   jamais nus ; un résultat `ok` avec son corps ; un log avec son payload exact. Un
   `assert.throws(() => f())` nu survit à un `throw ''` : le 2ᵉ argument **n'est pas optionnel**.
2. **Asserter tout l'objet / toute la séquence, pas un champ.** `deepEqual` sur l'objet retourné
   **complet** et sur la **liste d'appels complète** (args inclus) : vérifier un seul champ laisse
   survivre les mutants sur les autres.
3. **Trianguler les bornes ET les opérateurs.** (prolongement direct de la triangulation ci-dessus)
   Ajouter le cas **sur la borne** (valeur d'égalité) pour distinguer `>` de `>=`, le cas **juste
   dehors**, et pour un opérateur un **discriminateur asymétrique** (`a·b ≠ b·a`, contient-mais-pas-
   segment, `#` en milieu de ligne vs en tête). Un exemple unilatéral ne distingue ni `>`/`>=` ni
   `&&`/`||` ni les ancres de regex `^`/`$`.
4. **Nourrir le cas absent/null à côté du présent.** Pour chaque `?.`, `??`, argument par défaut,
   court-circuit `&&`/`||` : écrire le **jumeau** avec l'entrée null/absente/omise. Le happy-path seul
   laisse la branche d'absence vivante. (Cluster le plus fréquent de l'audit.)
5. **Collections à ≥2 éléments, non triés, avec un decoy.** `some`/`every`/`find`/tri/`length` sont
   **indistinguables** sur 0-1 élément ou une liste déjà triée. Deux éléments délibérément non triés
   plus un intrus hors-scope font diverger les mutants (et attrapent les off-by-last).
6. **Une branche inatteignable par les tests = défaut de conception, pas une exemption.** Si un test
   ne **peut pas** atteindre une branche (logique derrière de l'I/O, fonction non exportée, script
   top-level à effets de bord, composition root), extraire un **seam pur** / injecter un **port** /
   **nommer** chaque factory de wiring jusqu'à ce que chaque branche soit atteignable. C'est le driver
   n°1 des scores 0 %. « Pure glue, pas testable » n'est jamais une excuse, c'est le diagnostic.

Un **second audit** (2026-07-27, quatre fichiers d'un même incrément) a montré que ces six réflexes,
pourtant déjà gravés, n'avaient pas suffi. Quatre formes de plus, qu'aucun des six ne nomme :

7. **Un fixture ne doit JAMAIS être produit par le code qu'il teste.** Un fixture sérialisé avec la
   **même fonction** que la production rend l'assertion tautologique : « ne pas réécrire ce fichier »
   et « le réécrire à l'identique » deviennent indistinguables, le test est vert et ne prouve rien.
   Fabriquer le fixture **autrement** (autre indentation, pas de newline finale, la forme qu'une
   personne laisserait à la main) pour que la revendication soit **réfutable**.
8. **La valeur de retour d'un double doit être une empreinte.** Un stub qui rend `0`, `""` ou `[]`
   rend exactement ce qu'une vraie implémentation rendrait dans le cas nominal : le câblage n'est
   alors prouvé par rien (le code pourrait appeler le vrai composant, ou l'appeler sans argument, et
   tout resterait vert). Rendre une valeur **qu'aucune implémentation réelle ne produirait**, et
   **enregistrer les arguments reçus**.
9. **Une condition à N raisons demande N tests, un par raison SEULE.** Si chaque fixture déclenche
   deux termes à la fois, aucun terme n'est jamais la cause unique : on peut en supprimer un et la
   suite reste verte. Distinct de la triangulation d'opérateur (§3) : là, tous les opérateurs peuvent
   être justes et la couverture mentir quand même.
10. **Une transformation conditionnée par la plateforme doit être une fonction pure nommée, nourrie
    de données de l'AUTRE plateforme.** Inlinée, elle est un no-op sur la plateforme de CI : aucun
    test ne peut la distinguer de l'identité, et la régression n'apparaît que chez les
    utilisateur·rices. « Pas testable ici » veut dire « à extraire », jamais « à sauter ».

> **Vérifier un mutant, ce n'est pas raisonner dessus.** Appliquer le mutant **à la main** sur la
> suite complète (quelques secondes) avant ET après avoir écrit le test : le second audit a ainsi
> attrapé un mutant classé « tué » qui était en fait l'**autre branche** du même ternaire, toujours
> vivante parce que l'assertion disait `.includes(…)` au lieu de nommer la liste entière (§2).
>
> **Simplifier la production plutôt qu'excuser le mutant.** Avant de classer un survivant
> « équivalent », se demander s'il ne signale pas du **code qui ne peut rien changer** (un garde
> redondant, un `?? {}` devant un spread d'objet qui tolère déjà `undefined`, une borne déjà garantie
> par l'indexation). Le supprimer dit la même chose en moins de code, et le mutant disparaît avec lui.
>
> **Une revendication de durcissement nomme les FICHIERS mesurés, jamais un glob.** « `scripts/**`
> est durci » a fait passer, deux semaines durant, du code **jamais mesuré** pour du code couvert, et
> a activement découragé de le re-vérifier. Un faux « fait » coûte plus cher qu'un trou connu.
>
> **Le score suit la façon dont le code a été écrit, pas la présence de tests.** Dans le second audit,
> le cœur métier écrit en baby-steps était à 87 %, la **glue de composition écrite après coup** autour
> d'un cœur déjà vert à 51 %. Le composition root prend son seam **quand on l'écrit**, pas quand on
> l'audite (§6) : c'est une habitude de **conception**, pas d'assertion, et c'est pour ça que la
> connaître ne suffit pas.
>
> **Signal objectif : le mutation score, pas la couverture de lignes** (une suite peut couvrir 100 %
> des lignes et tuer 0 % des mutants). Savoir aussi **ne pas chasser les équivalents** (mutants
> indistinguables du code d'origine : wiring par défaut d'un port injecté, `?? []` qui recollapse en
> string après `.map().join('')`, regex greedy masquée par un `.trim()` aval, construction real-SDK
> observable seulement en réseau) et **se méfier des faux-timeouts** qui gonflent artificiellement le
> score (brider `concurrency`/`timeout` avant de croire un run).

## Portée

Cette discipline **vaut pour tous les langages** et tous les types de code. C'est le socle
non négociable. Les déclinaisons spécialisées (par framework, par langage, par style d'archi)
la **présupposent** sans jamais la contredire.
