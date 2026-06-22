import { useState, useEffect, type FC } from "react";
import { useAuthStore } from "../stores/auth";
import APIService from "../services/APIService";
import ConfirmModal    from "../components/ConfirmModal";
import { useConfirm }  from "../hooks/useConfirm";
import { useToastStore } from "../stores/toast";
import MainHeader from "../components/MainHeader";
import AdminSubHeader from "../components/AdminSubHeader";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AdminUsersPage: FC = () => {
  const [users, setUsers]   = useState<User[]>([]);
  const authStore           = useAuthStore();
  const toast               = useToastStore();
  const { confirm, confirmModalProps } = useConfirm();

  useEffect(() => {
    APIService.getUsers()
      .then((res) => setUsers(res.data))
      .catch(() => toast.addToast("Nu ai acces sau a aparut o eroare la incarcarea utilizatorilor.", "error"));
  }, [toast]);

  const changeRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    const ok = await confirm({ title: "Schimbare rol", message: `Schimbi rolul lui ${user.name} in ${newRole}?`, variant: "warning", confirmLabel: "Schimba rolul" });
    if (!ok) return;
    try {
      await APIService.updateUserRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
    } catch {
      toast.addToast("Eroare la schimbarea rolului.", "error");
    }
  };

  return (
    <>
      <MainHeader />
      {authStore.isAdmin && <AdminSubHeader onOpenCreate={() => {}} />}

      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Administrare Utilizatori</h1>
          <div className="badge badge-lg">{users.length} utilizatori</div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full bg-base-100 shadow-xl rounded-lg">
            <thead className="bg-base-200">
              <tr>
                <th>Nume</th>
                <th>Email</th>
                <th>Rol Curent</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover">
                  <td className="font-bold">
                    <div className="flex items-center space-x-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                          <span className="text-xs">{user.name.charAt(0)}</span>
                        </div>
                      </div>
                      <div>{user.name}</div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={user.role === "admin" ? "badge badge-primary" : "badge badge-ghost"}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {user.email !== authStore.user?.email ? (
                      <button
                        onClick={() => changeRole(user)}
                        className={`btn btn-xs btn-outline ${user.role === "admin" ? "btn-warning" : "btn-success"}`}
                      >
                        Da-i rol de {user.role === "admin" ? "User" : "Admin"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Tu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal {...confirmModalProps} />
    </>
  );
};

export default AdminUsersPage;