import { useState } from "react";
import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Market from "./pages/Resale";
import Trading from "./pages/Trading";

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  return (
    <Routes>
      <Route element={<Layout apiKey={apiKey} />}>
        <Route path="/" element={<Home apiKey={apiKey} setApiKey={setApiKey} />} />
        <Route path="/resale" element={<Market apiKey={apiKey} />} />
        <Route path="/trades" element={<Trading apiKey={apiKey} />} />
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
