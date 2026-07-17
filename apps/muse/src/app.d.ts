declare global {
  namespace App {
    interface Locals { admin: boolean; user: import('$lib/types').User | null }
  }
}
export {};
