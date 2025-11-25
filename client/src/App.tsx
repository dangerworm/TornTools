import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import Resale from "./pages/Resale";
import Market from "./pages/Market";
import Time from "./pages/Time";
// import Trading from "./pages/Trading";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/resale" element={<Resale />} />
        <Route path="/market/:itemId" element={<Market />} />
        <Route path="/time" element={<Time />} />

        <Route path="*" element={<h1>Not Found</h1>} />
      </Route>
    </Routes>
  );
}

export default App;
