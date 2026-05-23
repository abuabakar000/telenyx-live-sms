'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MessageSquare, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';

import { Suspense } from 'react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@inexlabs.com',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    const callbackUrl = searchParams.get('callbackUrl') || '/inbox';

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        showErrorToast(result.error, 'Sign-In Failed');
      } else {
        showSuccessToast('Welcome back to Inex Labs SMS inbox!', 'Sign-In Successful');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      showErrorToast(err.message || 'An unexpected error occurred.', 'Authentication Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-panel border border-slate-800/80 shadow-2xl">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
        <CardDescription className="text-xs">
          Enter your credentials to manage CRM conversations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <Input
              type="email"
              placeholder="admin@inexlabs.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              disabled={isLoading}
              {...register('email')}
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Password</label>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                disabled={isLoading}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full mt-2 py-2.5 font-bold uppercase tracking-wider text-xs"
            variant="primary"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-red-600/5 blur-[120px] select-none pointer-events-none animate-pulse duration-[6s]" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-red-800/5 blur-[130px] select-none pointer-events-none animate-pulse duration-[8s]" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" align="center" className="mb-2" />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] -mt-1.5">SMS Inbox & CRM</span>
        </div>

        {/* Login Card inside Suspense */}
        <Suspense fallback={<div className="text-center text-slate-400">Loading...</div>}>
          <LoginForm />
        </Suspense>

        {/* Seeding credentials info */}
        <div className="text-center mt-6 p-4 rounded-lg bg-slate-900/30 border border-slate-800/40 backdrop-blur-sm">
          <p className="text-[11px] text-slate-400">
            <span className="font-semibold text-[#ef4444] uppercase">Seed Credentials:</span>
            <br />
            Email: <code className="text-slate-200 bg-slate-850 px-1 py-0.5 rounded">admin@inexlabs.com</code>
            <span className="mx-2">|</span>
            Password: <code className="text-slate-200 bg-slate-850 px-1 py-0.5 rounded">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
