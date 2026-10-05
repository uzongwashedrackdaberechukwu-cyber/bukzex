import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import WhyChooseUs from "./components/WhyChooseUs";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";

import ResponsivePreview from "./components/ResponsivePreview";

import Customer from "./pages/Customer";
import CustomerServices from "./pages/CustomerServices";
import ServicePurchase from "./pages/ServicePurchase";
import CustomerOrders from "./pages/CustomerOrders";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerSettings from "./pages/CustomerSettings";
import CryptoWallet from "./pages/CryptoWallet";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

import "./App.css";

function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <HowItWorks />
      <WhyChooseUs />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/preview"
          element={<ResponsivePreview />}
        />

        {/* CUSTOMER */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/customer"
            element={<Customer />}
          />

          <Route
            path="/customer/services"
            element={<CustomerServices />}
          />

          <Route
            path="/customer/services/:serviceId/checkout"
            element={<ServicePurchase />}
          />

          <Route
            path="/customer/services/:serviceId"
            element={<ServicePurchase />}
          />

          <Route
            path="/customer/crypto"
            element={<CryptoWallet />}
          />

          <Route
            path="/customer/orders"
            element={<CustomerOrders />}
          />

          <Route
            path="/customer/profile"
            element={<CustomerProfile />}
          />

          <Route
            path="/customer/settings"
            element={<CustomerSettings />}
          />
        </Route>

        {/* ADMIN */}
        <Route element={<AdminProtectedRoute />}>
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
