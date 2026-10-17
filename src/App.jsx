import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Reg from "./Registration";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Reg />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;