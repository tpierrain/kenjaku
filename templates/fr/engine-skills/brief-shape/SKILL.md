---
name: brief-shape
description: "La forme dans laquelle TOUTE note de préparation s'écrit : la première page est la prépa entière, les munitions sont pliées en dessous. À charger avant d'écrire ou de réécrire une prépa de 1-1, une prépa de réunion, une prépa de conversation difficile ou un briefing du jour, c'est-à-dire toute note dont le `type:` commence par `prep-` ou `briefing-`. À charger aussi quand on te demande de raccourcir, de resserrer ou de « rendre utilisable en direct » une note de ce genre. Elle porte la règle ; les skills qui produisent des prépas lui obéissent au lieu de la réécrire."
version: 1.0.0
---

# brief-shape : la première page EST la prépa

> **Le problème que ça supprime.** En face de quelqu'un, il te faut la page depuis laquelle tu vas
> parler. Ce qui tue une prépa, ce n'est pas le manque de matière : c'est que la matière arrive en
> premier et qu'il faut la trier dans la pièce. La forme ci-dessous met ce que tu vas dire sur la
> première page, et plie les preuves en dessous, où elles attendent qu'on en ait besoin.

## La forme

**Périmètre : décidé par un préfixe, jamais par un dossier.** Cette forme s'applique à toute note dont
le `type:` du frontmatter commence par `prep-` ou `briefing-` (`prep-1-1`, `prep-meeting`,
`briefing-day`, et tout type de prépa inventé plus tard, couvert le jour où il est écrit pour la
première fois). Une note sans `type:` est hors périmètre.

**La première page, c'est tout ce qui se trouve entre le titre `#` de la note et le premier titre
`##`.** C'est toute l'ancre : pas de nom de section magique, donc la règle se lit pareil dans
n'importe quelle langue, et chaque section `##` en dessous est une munition par construction.

### Au-dessus de la pliure : ce que tu vas dire

- **7 puces maximum**, de premier niveau, une phrase dite à voix haute par puce. À plat : pas
  d'imbrication, pas de sous-titres, pas de tableaux, pas de liens à aller ouvrir.
- **Aucune puce ne dépasse 220 caractères.** Sans ce plafond, « sept puces » devient sept
  paragraphes. Une phrase qu'une personne prononce vraiment fait 120 à 180 caractères.
- **Sept est un maximum, jamais un quota.** Si le vault ne soutient que deux choses solides, la prépa
  fait deux puces. **Une prépa peu documentée le dit** (une ligne finale nommant ce qui n'est **pas
  documenté**) et elle ne remplit jamais pour atteindre un nombre. Le remplissage est le seul défaut
  qui ferait mentir cette fonctionnalité.
- **Rien d'autre au-dessus de la pliure** : pas de contexte, pas de justification, pas de liste de
  sources, pas de préambule. Quelqu'un à qui on tend cette page trente secondes avant d'entrer doit
  pouvoir y aller avec elle seule.

### En dessous de la pliure : les munitions

- **Une section `##`, étiquetée pour que son statut soit sans ambiguïté** : « à n'ouvrir que si on te
  challenge, si on te conteste ou si on te le demande ». On ne les déroule jamais spontanément, ni
  dans la pièce ni dans une réponse.
- **Chaque munition porte trois choses : sa citation mot pour mot, sa date et le chemin de sa
  source.** C'est la moitié porteuse de toute la forme. Le but, c'est de répondre à une contradiction
  avec les mots exacts et la date, sur le moment, sans rien ouvrir d'autre. Une munition sans sa
  citation n'est pas une munition, c'est le souvenir d'une munition.
- **En dessous, la longueur n'est pas plafonnée, et c'est volontaire.** Le plafond protège la première
  page ; il n'a jamais eu pour but de raccourcir les preuves.

### Le bloc de clôture : ce que le vault ne porte pas

Termine par un bloc court disant **ce que le vault soutient et ce qu'il ne soutient pas**, pour qu'une
affirmation négative ne soit jamais prononcée sans que la personne qui la prononce sache qu'elle n'est
pas étayée. C'est [`sync-sources` § Discipline d'affirmation](../sync-sources/SKILL.md) appliquée au
moment où ça coûte le plus cher : ici, la phrase est dite à la personne qu'elle concerne, devant elle.

## La forme est vérifiée, pas seulement écrite

**Une note de type prépa dont la première page enfreint les règles ci-dessus est REFUSÉE au moment
où on l'écrit** : le garde d'écriture du moteur dit quelle règle a sauté et de combien, et la note
n'existe pas tant que ce n'est pas corrigé. Une règle qu'il faut se rappeler a déjà échoué ; celle-ci
ne dépend pas de la mémoire de qui que ce soit.

Ce qu'il compte, et rien d'autre : les puces au-dessus du premier `##`, leur nombre et leur
longueur, et le fait qu'il y ait une première page. Il ne juge jamais ce qu'une puce *dit*, et il ne
regarde jamais sous la pliure.

## Pourquoi la règle vit ici et nulle part ailleurs

Une forme réécrite dans chaque skill qui produit une prépa, ce sont plusieurs formes : elles dérivent,
et celle que tu obtiens dépend de la porte par laquelle tu es passé·e. Donc c'est ce fichier qui la
porte, et une skill productrice (`prepare-1-1` et ses semblables) la nomme et lui obéit, exactement
comme ces skills défèrent déjà à `sync-sources` pour la discipline d'affirmation au lieu d'écrire la
leur.

Si tu es en train de produire une prépa et que tu es arrivé·e ici depuis une skill qui ne mentionnait
pas ce fichier, c'est que cette skill est antérieure à la forme. Suis la forme quand même : c'est elle
la règle, et la skill plus ancienne n'en est que la copie.
