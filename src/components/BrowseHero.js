import React from "react";
import { Link } from "react-router-dom";
import "./BrowseHero.css";

const BrowseHero = ({ regulationLabel = "Champions Reg M-A" }) => (
  <section className="browse-hero card-surface" aria-labelledby="browse-hero-title">
    <div className="browse-hero-text">
      <p className="browse-hero-eyebrow">VGC Pokédex</p>
      <h1 id="browse-hero-title">Browse Pokémon</h1>
      <p className="browse-hero-copy">
        Explore species with live <strong>{regulationLabel}</strong> usage and win rate.
        Open a species to see stats, meta partners, and add to your team.
      </p>
    </div>
    <Link to="/" className="browse-hero-cta">
      Open Team Builder →
    </Link>
  </section>
);

export default BrowseHero;
