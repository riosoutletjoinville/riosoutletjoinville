// src/hooks/usePermissions.ts
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'admin' | 'usuario' | 'vendedor' | 'contador';

export function usePermissions() {
  const { user } = useAuth();
  
  // Obter o tipo do usuário dos metadados ou de uma tabela separada
  const userRole = (user?.user_metadata?.tipo as UserRole) || 'usuario';
  
  const isAdmin = userRole === 'admin';
  const isContador = userRole === 'contador';
  const isVendedor = userRole === 'vendedor';
  const isUsuario = userRole === 'usuario';
  
  const canAccess = (requiredRoles: UserRole | UserRole[]) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(userRole);
  };
  
  const canAccessDashboardItem = (itemPath: string) => {
    // Contador só pode ver /dashboard/contador
    if (isContador) {
      return itemPath === '/dashboard/contador' || itemPath === '/dashboard';
    }
    
    // Admin pode ver tudo
    if (isAdmin) {
      return true;
    }
    
    // Vendedor e usuário tem suas próprias restrições
    if (isVendedor || isUsuario) {
      // Implementar conforme necessidade
      return !itemPath.includes('/admin') && 
             !itemPath.includes('/configuracoes') &&
             itemPath !== '/dashboard/contador';
    }
    
    return false;
  };
  
  return {
    userRole,
    isAdmin,
    isContador,
    isVendedor,
    isUsuario,
    canAccess,
    canAccessDashboardItem,
  };
}