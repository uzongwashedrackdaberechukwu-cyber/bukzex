import { lazy, Suspense } from "react";
import Brand from "./components/Brand";
import RouteExperience from "./components/RouteExperience";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

const Landing = lazy(() => import("./pages/Landing"));

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailActionHandler = lazy(() => import("./pages/EmailActionHandler"));

const ResponsivePreview = lazy(() => import("./components/ResponsivePreview"));

const Customer = lazy(() => import("./pages/Customer"));
const CustomerServices = lazy(() => import("./pages/CustomerServices"));
const ServicePurchase = lazy(() => import("./pages/ServicePurchase"));
const CustomerOrders = lazy(() => import("./pages/CustomerOrders"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfile"));
const CustomerSettings = lazy(() => import("./pages/CustomerSettings"));
const CryptoWallet = lazy(() => import("./pages/CryptoWallet"));

const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProtectedRoute = lazy(
  () => import("./components/AdminProtectedRoute"),
);

function App() {
  return (
    <BrowserRouter>
      <RouteExperience />
      <Suspense
        fallback={
          <main className="auth-loading" role="status">
            Getting things ready…
          </main>
        }
      >
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/action" element={<EmailActionHandler />} />
          <Route path="/preview" element={<ResponsivePreview />} />

          {/* CUSTOMER */}
          <Route element={<ProtectedRoute />}>
            <Route path="/customer" element={<Customer />} />

            <Route path="/customer/services" element={<CustomerServices />} />

            <Route
              path="/customer/services/:serviceId/checkout"
              element={<ServicePurchase />}
            />

            <Route
              path="/customer/services/:serviceId"
              element={<ServicePurchase />}
            />

            <Route path="/customer/crypto" element={<CryptoWallet />} />

            <Route path="/customer/orders" element={<CustomerOrders />} />

            <Route path="/customer/profile" element={<CustomerProfile />} />

            <Route path="/customer/settings" element={<CustomerSettings />} />
          </Route>

          {/* ADMIN */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route
            path="*"
            element={
              <main className="bx-not-found">
                <Brand />
                <span className="bx-eyebrow">A LITTLE DETOUR</span>
                <h1>
                  Let’s get you back
                  <br />
                  to familiar ground.
                </h1>
                <p>
                  We couldn’t find that page. Your everyday essentials are still
                  right here.
                </p>
                <Link className="bx-button" to="/">
                  Back to BukzEx
                </Link>
              </main>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
