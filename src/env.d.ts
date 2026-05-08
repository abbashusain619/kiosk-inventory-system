/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: {
      id: number;
      email: string;
      roleId: number;
      roleName: string;
    };
    permissions?: string[];
  }
}
interface Window {
  showToast: (message: string, type?: 'success' | 'error') => void;
}