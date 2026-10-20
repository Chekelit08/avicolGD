/**
 * Fondo con manchas de color suaves que se mueven muy despacio (bordó, azul y verde de la marca).
 * Queda detrás de todo, no recibe clics y se queda quieto si el sistema pide menos movimiento.
 */
export function FondoAnimado() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-fondo"
    >
      <div className="absolute -top-[20vmax] -left-[15vmax] size-[55vmax] animate-mancha-1 rounded-full bg-mancha-1 blur-3xl motion-reduce:animate-none" />
      <div className="absolute top-[30vh] -right-[20vmax] size-[50vmax] animate-mancha-2 rounded-full bg-mancha-2 blur-3xl motion-reduce:animate-none" />
      <div className="absolute -bottom-[25vmax] left-[25vw] size-[45vmax] animate-mancha-3 rounded-full bg-mancha-3 blur-3xl motion-reduce:animate-none" />
      {/* Grano muy leve para que las manchas no se vean "plásticas". */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--borde)_1px,transparent_1px)] [background-size:22px_22px] opacity-40" />
    </div>
  )
}
