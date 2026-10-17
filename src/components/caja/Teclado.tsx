import type { Tecla } from '../../lib/importe'

const TECLAS: { tecla: Tecla; texto: string; etiqueta?: string }[] = [
  { tecla: '7', texto: '7' },
  { tecla: '8', texto: '8' },
  { tecla: '9', texto: '9' },
  { tecla: '4', texto: '4' },
  { tecla: '5', texto: '5' },
  { tecla: '6', texto: '6' },
  { tecla: '1', texto: '1' },
  { tecla: '2', texto: '2' },
  { tecla: '3', texto: '3' },
  { tecla: '000', texto: '000', etiqueta: 'Tres ceros' },
  { tecla: '0', texto: '0' },
  { tecla: 'borrar', texto: '⌫', etiqueta: 'Borrar el último número' },
]

/** Teclado numérico propio, con teclas de membrana como las de la balanza. */
export function Teclado({ onTecla }: { onTecla: (tecla: Tecla) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Teclado numérico">
      {TECLAS.map(({ tecla, texto, etiqueta }) => (
        <button
          key={tecla}
          type="button"
          aria-label={etiqueta}
          onClick={() => onTecla(tecla)}
          className="h-16 touch-manipulation rounded-xl border border-b-4 border-tecla-borde border-b-tecla-sombra bg-tecla text-3xl font-bold text-texto cifras select-none active:translate-y-[2px] active:border-b-2"
        >
          {texto}
        </button>
      ))}
    </div>
  )
}
