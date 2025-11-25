import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Markets from "./pages/Markets";
import ItemDetails from "./pages/ItemDetails";
import Resale from "./pages/Resale";
import Time from "./pages/Time";
// import Trading from "./pages/Trading";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/item/:itemId" element={<ItemDetails />} />
        <Route path="/resale" element={<Resale />} />
        <Route path="/time" element={<Time />} />

        <Route path="*" element={<h1>Not Found</h1>} />
      </Route>
    </Routes>
  );
}

export default App;
