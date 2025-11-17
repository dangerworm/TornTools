import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Resale from "./pages/Resale";
import SignIn from "./pages/SignIn";
// import Trading from "./pages/Trading";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/resale" element={<Resale />} />
        <Route path="/signin" element={<SignIn />} />
        {/* <Route path="/trades" element={<Trading />} /> */}
        {/* <Route path="/other">
          <Route index element={<OtherIndex />} />
          <Route path="settings" element={<OtherSettings />} />
        </Route> */}
        {/* 404 / catch-all */}
        <Route path="*" element={<h1>Not Found</h1>} />
      </Route>
    </Routes>
  );
}

export default App;
