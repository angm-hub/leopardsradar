import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";

/**
 * Product Showcase — la section "montre le produit" (passe 2 accueil, 04/09).
 *
 * Diagnostic Alexandre : l'accueil "veut tout et rien dire" parce qu'il
 * DECRIT le produit sans jamais le MONTRER. Reference structure retenue :
 * la home de Ballogy, qui aligne de vraies captures d'ecran de son dashboard
 * plutot qu'un mur de texte.
 *
 * Ici : un bento de 4 vues reelles du produit (captures figees dans
 * /public/showcase). Chacune renvoie a l'ecran vivant. C'est ce qui
 * transforme "encore une base de data" en "un vrai outil qu'on veut ouvrir".
 *
 * Les captures sont statiques (figees au 04/09) : elles vieillissent, mais
 * elles montrent la matiere, pas une valeur a jour. A rafraichir si la DA
 * d'un ecran bouge.
 */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

type Shot = {
  to: string;
  img: string;
  alt: string;
  eyebrow: string;
  title: string;
  desc: string;
  cta: string;
  /** classe de span md · le premier est large */
  span: string;
  /** hauteur du cadre image */
  frame: string;
};

const SHOTS: Shot[] = [
  {
    to: "/radar",
    img: "/showcase/galaxy.jpg",
    alt: "La galaxie du radar : chaque Léopard placé par niveau de jeu et par jeunesse.",
    eyebrow: "Le radar",
    title: "La galaxie du vivier",
    desc: "Chaque joueur placé par niveau et par jeunesse. Le coin haut droit, ce sont les pépites déjà au niveau.",
    cta: "Explorer le radar",
    span: "lg:col-span-7",
    frame: "h-52 sm:h-64 lg:h-[19rem]",
  },
  {
    to: "/radar",
    img: "/showcase/empreinte.jpg",
    alt: "L'empreinte percentile d'un joueur : son rang face aux autres du même poste.",
    eyebrow: "La fiche",
    title: "L'empreinte percentile",
    desc: "Chaque joueur noté face à son poste. Niveau, valeur, jeunesse, impact, ancrage.",
    cta: "Ouvrir une fiche",
    span: "lg:col-span-5",
    frame: "h-52 sm:h-64 lg:h-[19rem]",
  },
  {
    to: "/switchables",
    img: "/showcase/switchables.jpg",
    alt: "Le vivier récupérable : les binationaux encore basculables vers la RDC, classés par valeur.",
    eyebrow: "L'éligibilité",
    title: "Le vivier récupérable",
    desc: "Les binationaux encore basculables vers la RDC, classés par valeur de marché.",
    cta: "Voir les switchables",
    span: "lg:col-span-6",
    frame: "h-56 sm:h-72",
  },
  {
    to: "/clubs",
    img: "/showcase/clubs.jpg",
    alt: "Le classement des clubs par nombre de Léopards suivis.",
    eyebrow: "Les clubs",
    title: "Qui forme les Léopards",
    desc: "Le classement des clubs par nombre de joueurs suivis, du pays à la diaspora.",
    cta: "Voir le classement",
    span: "lg:col-span-6",
    frame: "h-56 sm:h-72",
  },
];

export function ProductShowcase() {
  return (
    <section className="container-site py-20 md:py-28 border-t border-border/40">
      <div className="max-w-2xl mb-12 md:mb-16">
        <p className="label-mono text-cobalt-mist mb-3">Le produit</p>
        <h2 className="display-heading text-3xl md:text-5xl text-foreground text-balance">
          Regarde ce qu'il y a dedans.
        </h2>
        <p className="mt-5 text-base md:text-lg text-foreground/70 text-balance">
          Le radar recense chaque Léopard, du championnat local à la diaspora,
          et le qualifie. Voici les vues qui font le tri.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5"
      >
        {SHOTS.map((shot) => (
          <motion.div key={shot.title} variants={itemVariants} className={shot.span}>
            <ShowcaseTile shot={shot} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function ShowcaseTile({ shot }: { shot: Shot }) {
  return (
    <Link
      to={shot.to}
      className="group relative flex h-full flex-col overflow-hidden rounded-[18px] surface-1 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:[box-shadow:0_0_0_0.5px_rgba(245,197,24,0.35),0_1px_2px_rgba(0,0,0,0.4),0_18px_44px_rgba(245,197,24,0.10)]"
    >
      {/* Cadre capture — object-top pour montrer le haut de l'écran, ring
          interne pour l'effet "vrai écran encastré". */}
      <div className={`relative w-full overflow-hidden ${shot.frame}`}>
        <img
          src={shot.img}
          alt={shot.alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        {/* voile bas pour asseoir la typo du footer sur l'image */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent"
        />
        {/* hairline interne haut · effet verre */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[18px] shadow-[inset_0_1px_0_rgba(159,184,224,0.10)]"
        />
      </div>

      {/* Footer éditorial */}
      <div className="relative flex flex-1 flex-col p-5 md:p-6">
        <p className="label-mono-sm text-cobalt-mist mb-2">{shot.eyebrow}</p>
        <h3 className="display-heading text-xl md:text-2xl text-foreground">
          {shot.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground/65">
          {shot.desc}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {shot.cta}
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

export default ProductShowcase;
