import { useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import gsap from "gsap";
import Home from "./Home";
import Reg from "./Registration";
import "./Home.css";
import { RouteTransitionContext } from "./RouteTransitionContext";

const TRANSITION_BLOCK_COUNT = 36;
const BLOCK_STAGGER = { each: 0.06, from: "edges", grid: [6, 6] };

function AppRoutes() {
  const navigate = useNavigate();
  const [transitionActive, setTransitionActive] = useState(false);
  const overlayRef = useRef(null);
  const isTransitioning = useRef(false);

  const transitionTo = (path) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setTransitionActive(true);

    requestAnimationFrame(() => {
      const blocks = overlayRef.current?.querySelectorAll(".route-transition-block");
      if (!blocks?.length) {
        navigate(path);
        isTransitioning.current = false;
        setTransitionActive(false);
        return;
      }

      gsap.to(blocks, {
        opacity: 1,
        duration: 0,
        stagger: BLOCK_STAGGER,
        onComplete: () => {
          navigate(path);
          gsap.delayedCall(0.08, () => {
            gsap.to(blocks, {
              opacity: 0,
              duration: 0,
              stagger: BLOCK_STAGGER,
              onComplete: () => {
                isTransitioning.current = false;
                setTransitionActive(false);
              },
            });
          });
        },
      });
    });
  };

  return (
    <RouteTransitionContext.Provider value={transitionTo}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Reg />} />
      </Routes>
      {transitionActive && (
        <div className="route-transition" ref={overlayRef} aria-hidden="true">
          {Array.from({ length: TRANSITION_BLOCK_COUNT }, (_, i) => (
            <div className="route-transition-block" key={i} />
          ))}
        </div>
      )}
    </RouteTransitionContext.Provider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
