import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ActivityPage from "@/pages/ActivityPage";
import AdminRegisterPage from "@/pages/AdminRegisterPage";
import BillingPage from "@/pages/BillingPage";
import CampaignsPage from "@/pages/CampaignsPage";
import ComposePage from "@/pages/ComposePage";
import ContactsListPage from "@/pages/ContactsListPage";
import ContactsPage from "@/pages/ContactsPage";
import CustomerRegisterPage from "@/pages/CustomerRegisterPage";
import DevelopersPage from "@/pages/DevelopersPage";
import HelpPage from "@/pages/HelpPage";
import HomePage from "@/pages/HomePage";
import InboxPage from "@/pages/InboxPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import LoginPage from "@/pages/LoginPage";
import NewCampaignPage from "@/pages/NewCampaignPage";
import NotFound from "@/pages/NotFound";
import ReportsPage from "@/pages/ReportsPage";
import SendersPage from "@/pages/SendersPage";
import SettingsPage from "@/pages/SettingsPage";
import TemplatesPage from "@/pages/TemplatesPage";
import VoicePage from "@/pages/VoicePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<CustomerRegisterPage />} />
      <Route path="/admin-register" element={<AdminRegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/compose" element={<ComposePage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/new" element={<NewCampaignPage />} />
          <Route path="/contacts-lists" element={<ContactsListPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/senders" element={<SendersPage />} />
          <Route path="/voice" element={<VoicePage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
