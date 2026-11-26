import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-6xl">🧩</p>
      <h1 className="mt-4 text-3xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 text-muted-foreground">Puede que el producto ya no esté disponible.</p>
      <Link href="/productos" className="btn-primary mt-8">Ver catálogo</Link>
    </div>
  );
}
