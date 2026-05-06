/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    userId?: number;
  }
}
interface Window {
  showToast: (message: string, type?: 'success' | 'error') => void;
}