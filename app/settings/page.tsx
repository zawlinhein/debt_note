import ChangePasswordForm from "@/components/ChangePasswordForm";
import AdminDiscordIdForm from "@/components/AdminDiscordIdForm";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      <AdminDiscordIdForm />
      <div className="border-t border-gray-100 pt-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
