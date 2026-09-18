import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import AdminPage from "@/pages/AdminPage";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
