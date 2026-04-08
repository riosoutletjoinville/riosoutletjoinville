// app/login/page.tsx
'use client'

import '@/app/globals.css';
import LoginForm from '@/components/auth/LoginForm';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export function LoginPageContent() {  
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full lg:grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between relative overflow-hidden p-12">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-purple-900/40 z-0" />
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-20" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-15" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10">
            <div className="mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center mb-6"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </motion.div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                <Link href="/">
                  <div className="relative w-32 md:w-40 h-10 md:h-12">
                    <Image src="/logomarca.jpg" alt="Atual Modas Joinville" fill className="object-contain" priority />
                  </div>
                </Link>
              </h1>
              <p className="text-lg text-purple-200 max-w-md leading-relaxed">
                Gestão completa para seu negócio. Tudo que você precisa em um só lugar.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="px-8 pt-8 pb-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg mb-5 mx-auto"
                >
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Acessar Sistema</h2>
                <p className="text-gray-500 text-sm">Entre com suas credenciais para continuar</p>
              </div>
              <div className="px-8 pb-8">
                <LoginForm />
              </div>
              <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">© {new Date().getFullYear()} Rios Outlet</p>
              </div>
            </div>
            <div className="mt-6 lg:hidden">
              <p className="text-center text-sm text-purple-200">Sistema de gestão empresarial completo</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}