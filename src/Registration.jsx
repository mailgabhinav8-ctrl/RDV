import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Registration.css";

export default function Reg() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic version for now — wire this up to your real registration
    // endpoint whenever that's ready.
    console.log("Registration submitted:", form);
    setSubmitted(true);
  };

  return (
    <div className="reg">
      <nav className="topnav">
        <button className="topnav-btn" onClick={() => navigate("/")}>
          Session
        </button>
        <button className="topnav-btn">Menu</button>
      </nav>

      <section className="reg-hero">
        {submitted ? (
          <>
            <p className="reg-eyebrow">02 / Confirmed</p>
            <h1 className="reg-title">You're in.</h1>
            <p className="reg-sub">
              We've sent your access link to {form.email || "your inbox"}.
              Keep an eye out — seats are capped and links aren't
              transferable.
            </p>
            <button className="reg-cta" onClick={() => navigate("/")}>
              [ Back to home ]
            </button>
          </>
        ) : (
          <>
            <p className="reg-eyebrow">02 / Register</p>
            <h1 className="reg-title">You're almost in.</h1>
            <p className="reg-sub">
              One session, one link, no replays. Fill this in and we'll hold
              your seat.
            </p>

            <form className="reg-form" onSubmit={handleSubmit}>
              <label className="reg-field">
                <span>Full name</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jordan Lee"
                  required
                />
              </label>

              <label className="reg-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <button type="submit" className="reg-cta">
                [ Complete registration ]
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}