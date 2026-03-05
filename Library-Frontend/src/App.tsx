import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthorsPage } from "./pages/AuthorsPage";
import { BooksPage } from "./pages/BooksPage";
import { HomePage } from "./pages/HomePage";
import { LoansPage } from "./pages/LoansPage";
import { ROUTES } from "./utils/constants";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path={ROUTES.home}
          element={<Navigate to={ROUTES.dashboard} replace />}
        />
        <Route path={ROUTES.dashboard} element={<HomePage />} />
        <Route path={ROUTES.authors} element={<AuthorsPage />} />
        <Route path={ROUTES.books} element={<BooksPage />} />
        <Route path={ROUTES.loans} element={<LoansPage />} />
      </Route>
    </Routes>
  );
}

export default App;
