import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

export default function PasswordChangeGuard({ children }) {
  const { mustChangePassword, clearMustChangePassword, isAuthenticated } = useAuth();

  const handlePasswordChanged = () => {
    clearMustChangePassword();
  };

  return (
    <>
      {children}
      {isAuthenticated && mustChangePassword && (
        <ChangePasswordModal
          isOpen={true}
          mustChange={true}
          onClose={() => {}}
          onSuccess={handlePasswordChanged}
        />
      )}
    </>
  );
}
