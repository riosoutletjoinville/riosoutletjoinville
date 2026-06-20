// components/auth/LoginForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div>Carregando...</div>;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        toast.success("Login realizado com sucesso!");
      } else {
        toast.error(result.error || "Email ou senha inválidos");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="h-12 rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          placeholder="seu@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="h-12 rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 pr-10"
            placeholder="Sua senha"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-gradient-to-r from-stone-900 to-stone-700 hover:from-stone-800 hover:to-stone-600 text-white font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar no Sistema"
        )}
      </Button>

      <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Problemas para acessar?{" "}
          <button
            type="button"
            className="text-purple-600 hover:text-purple-700 font-medium"
            onClick={() =>
              toast.error("Contate o suporte: suporte@riosoutlet.com.br")
            }
          >
            Contate o suporte
          </button>
        </p>
      </div>
    </form>
  );
}