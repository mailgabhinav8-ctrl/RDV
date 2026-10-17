import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Home.css";

gsap.registerPlugin(ScrollTrigger);

export default function Home({ onRegister = () => console.log("Register clicked") }) {
  const rootRef = useRef(null);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    // Declared outside gsap.context so the cleanup function below can
    // remove the exact same listener reference on unmount.
    let isScrolling = false;
    const handleMouseMove = (e) => {
      // Stop updating coordinates the moment scroll passes the threshold
      if (isScrolling) return;

      gsap.to(".mouse-follower", {
        x: e.clientX,
        y: e.clientY,
        duration: 0.3,
        ease: "power2.out",
        xPercent: -50,
        yPercent: -50,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);

    const ctx = gsap.context(() => {
      // --- Block-grid loading screen ---
      // A solid grid of squares covers the page on load, then each block
      // vanishes individually (edges first, center last) — duration:0
      // means every block still snaps instantly with no fade/scale, but
      // the stagger makes them disappear one-by-one rather than all at once.
      const loaderBlocks = gsap.utils.toArray(".loader-block");
      gsap.to(loaderBlocks, {
        opacity: 0,
        duration: 0,
        stagger: {
          each: 0.06,
          from: "edges",
          grid: [8, 8], // must match LOADER_BLOCK_COUNT's rows/cols below
        },
        delay: 0.8, // brief pause so the solid grid is visible first
        onComplete: () => {
          gsap.set(".loader", { display: "none" }); // fully out of the way once done
        },
      });

      // --- Floating background 3D flashcards: each is a real two-sided
      // card (front + back face, both with their own image — see the CSS
      // for the placeholder url()s) that continuously flips end over end.
      // Rotating `.float-card-inner` (not the faces individually) is what
      // keeps front/back moving together as one rigid card in 3D space.
      gsap.utils.toArray(".float-card-inner").forEach((el, i) => {
        gsap.to(el, {
          rotateY: 360,
          duration: 14 + i * 4, // stagger speeds so they don't sync up
          repeat: -1,
          ease: "none",
        });
        gsap.to(el.parentElement, {
          y: "+=25",
          duration: 5 + i,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      // --- Orb: locks at the last mouse position once scroll passes 20%
      // of the page's total available scroll, then grows in direct
      // proportion to scroll progress from that point to the bottom.
      // trigger: ".home", start "top top", end "bottom bottom" means
      // self.progress (0-1) tracks the ENTIRE page's scroll distance,
      // not just this one section — which is what "20% of page scroll"
      // needs.
      ScrollTrigger.create({
        trigger: ".home",
        start: "top top",
        end: "bottom bottom",
        scrub: 1, // a number (not `true`) lags/eases toward real scroll
                  // position instead of snapping to it every tick — this
                  // is what actually smooths the transition out
        onUpdate: (self) => {
          const p = self.progress;

          if (p >= 0.2) {
            if (!isScrolling) {
              isScrolling = true;
              // Kill any in-flight tracking tween so x/y freeze exactly
              // where the mouse last was, instead of drifting to a final
              // queued position.
              gsap.killTweensOf(".mouse-follower");
            }
            // Remap the remaining 20%-100% of scroll onto the orb's growth.
            // Using plain numbers in a single unit (px) here on purpose —
            // gsap.utils.interpolate("40px", "300vw", t) was the actual
            // cause of the clipping bug previously: it can't cleanly blend
            // two different CSS units and effectively snaps once t moves
            // off 0. Keep this plain-number approach if you tune the
            // threshold again.
            const t = (p - 0.2) / 0.8;
            const startSize = 64; // matches the orb's resting size in CSS
            const endSize = Math.max(window.innerWidth, window.innerHeight) * 3;
            const size = startSize + (endSize - startSize) * t;
            gsap.set(".mouse-follower", {
              width: `${size}px`,
              height: `${size}px`,
              opacity: gsap.utils.interpolate(0.8, 0.9, t),
            });
          } else {
            // Scrolled back above the threshold: resume mouse tracking
            // and reset the orb to its small resting size.
            isScrolling = false;
            gsap.set(".mouse-follower", {
              width: "64px",
              height: "64px",
              opacity: 0.8,
            });
          }
        },
      });

      // --- Hero entrance: orchestrated layout fade-ins ---
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from(".hero-eyebrow", { y: 16, opacity: 0, duration: 0.5 })
        .from(".hero-title-wrap", { y: 28, opacity: 0, duration: 0.7 }, "-=0.3")
        .from(".hero-sub", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(".hero-cta", { y: 16, opacity: 0, duration: 0.5 }, "-=0.35");

      // --- Scroll-triggered reveal blocks ---
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // --- Infinite vertical flashcard loop, driven entirely by scroll ---
      // These two constants must match the CSS: CARD_STEP is card height +
      // the gap between cards, CONTAINER_HEIGHT is .flashcard-viewport's
      // height. Keeping them here (rather than measuring the DOM) keeps
      // the math simple and predictable.
      const CARD_STEP = 300; // 280px card + 20px gap
      const CONTAINER_HEIGHT = 760;
      const cards = gsap.utils.toArray(".flashcard");
      const loopHeight = cards.length * CARD_STEP;
      const centerY = CONTAINER_HEIGHT / 2;

      ScrollTrigger.create({
        trigger: ".pin-section",
        start: "top top",
        end: "+=2000", // more runway = more scrolling needed per full loop
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          // How far the stack has "virtually" scrolled. The *3 just
          // controls how many full loops happen across the pin's total
          // scroll distance — raise it to cycle faster, lower to cycle
          // slower.
          const virtualScroll = self.progress * loopHeight * 3;

          cards.forEach((card, i) => {
            const base = i * CARD_STEP;
            // wrap() is what makes this infinite: once a card's position
            // would go negative or past loopHeight, it seamlessly re-enters
            // from the other side instead of stopping.
            const y = gsap.utils.wrap(0, loopHeight, base - virtualScroll);

            // Fade/scale cards down as they move away from dead-center,
            // so the centered card reads as the "active" flashcard.
            const cardCenter = y + CARD_STEP / 2;
            const distanceRatio = gsap.utils.clamp(
              0,
              1,
              Math.abs(cardCenter - centerY) / centerY
            );

            gsap.set(card, {
              y,
              opacity: 1 - distanceRatio * 0.75,
              scale: 1 - distanceRatio * 0.15,
            });
          });
        },
      });
    }, rootRef);

    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const flashcards = [
    { title: "01", body: "Swap this copy for your real content." },
    { title: "02", body: "Each card is a fixed step apart, looping forever." },
    { title: "03", body: "Position is driven purely by scroll progress." },
    { title: "04", body: "No drag, no autoplay — just the scrollbar." },
    { title: "05", body: "Scroll back up and it reverses cleanly too." },
  ];

  // 6 columns x 6 rows = 36 blocks — adjust grid-template-columns/-rows in
  // Home.css AND the stagger's grid:[6,6] above if you change this count.
  const LOADER_BLOCK_COUNT = 36;

  return (
    <div ref={rootRef} className="home">
      {/* Block-grid loading screen — covers everything, then dissolves
          from the outer edges inward */}
      <div className="loader" aria-hidden="true">
        {Array.from({ length: LOADER_BLOCK_COUNT }).map((_, i) => (
          <div className="loader-block" key={i} />
        ))}
      </div>

      {/* Floating decorative 3D flashcards — purely background, sits
          behind everything, ignores clicks. Each card has a front and
          back face (both filled, neither left blank) that flip together
          as it rotates. Cards 1 and 4 are near-vertical (barely tilted)
          and smaller than the rest — see .float-card-small in the CSS.
          Swap the background-image url()s in Home.css (.float-card-1
          through -5) for your real images — front/back per card can be
          the same image or two different ones. */}
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          className={`float-card float-card-${n} ${
            n === 1 || n === 4 ? "float-card-small" : ""
          }`}
          key={n}
          aria-hidden="true"
        >
          <div className="float-card-inner">
            <div className="float-card-face float-card-front" />
            <div className="float-card-face float-card-back" />
          </div>
        </div>
      ))}

      {/* Target layer element for cursor engine */}
      <div className="mouse-follower" aria-hidden="true" />

      {/* Background glowing decorative orbs */}
      <div className="glow-orb glow-top" aria-hidden="true" />
      <div className="glow-orb glow-bottom" aria-hidden="true" />

      <div className="intro-wrapper">
        <nav className="topnav">
          <button className="topnav-btn">Session</button>
          <button className="topnav-btn">Menu</button>
        </nav>

        <section className="hero">
          <p className="hero-eyebrow">01 / Live</p>

          <div className="hero-title-wrap">
            <h1 className="hero-title hero-title-base">
              This is 
              <br />
              some title
              <br />
              text
            </h1>
          </div>

          <p className="hero-sub">
            this is a paragraph 
          </p>

          <button className="hero-cta" onClick={() => navigate("/register")}>
            [ Register ]
          </button>
        </section>

        <section className="feature reveal">
          <h2>What you'll walk away with</h2>
          <p>
            Swap this copy for your real content — three concrete outcomes
            work better here than vague promises.
          </p>
        </section>

        <section className="feature reveal">
          <h2>Who it's for</h2>
          <p>
            Describe your audience in their own words, not your internal
            jargon.
          </p>
        </section>
      </div>

      {/* Infinite vertical flashcard scroller, entirely scroll-driven */}
      <section className="pin-section">
        <div className="flashcard-viewport">
          <div className="flashcard-track">
            {flashcards.map((card, i) => (
              <div className="flashcard" key={i}>
                <span className="flashcard-index">{card.title}</span>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="feature reveal">
        <h2>Ready when you are</h2>
        <button className="hero-cta" onClick={onRegister}>
          [ Register ]
        </button>
      </section>
    </div>
  );
}