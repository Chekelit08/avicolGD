/** Grupo de opciones excluyentes (radio) con aspecto de botones. */
export function Segmentado<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambio,
}: {
  etiqueta: string
  opciones: { valor: T; texto: string }[]
  valor: T
  onCambio: (v: T) => void
}) {
  return (
    <fieldset className="flex flex-wrap rounded-xl border border-borde bg-superficie p-1">
      <legend className="sr-only">{etiqueta}</legend>
      {opciones.map((o) => (
        <label
          key={o.valor}
          className="flex min-h-10 cursor-pointer items-center rounded-lg px-3 text-sm font-bold has-checked:bg-marca has-checked:text-sobre-marca has-focus-visible:outline-2 has-focus-visible:outline-foco"
        >
          <input
            type="radio"
            className="sr-only"
            checked={valor === o.valor}
            onChange={() => onCambio(o.valor)}
          />
          {o.texto}
        </label>
      ))}
    </fieldset>
  )
}
