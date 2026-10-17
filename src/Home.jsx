import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CircularCarousel from "./CircularCarousel";
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

    }, rootRef);

    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

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

      <section className="carousel-section">
        <div className="carousel-heading">
          <p className="hero-eyebrow">A rotating gallery</p>
          <h2>Explore the collection</h2>
        </div>
        <div className="carousel-frame">
          <CircularCarousel
            preset="cylinder"
            intro="rise"
            cardWidth={250}
            aspectRatio={1}
            speed={10}
            captions
            gap={28}
          />
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
