import { useEffect, useRef, useState } from 'react'
import logo from '../assets/logo-gonza.svg'
import { BotonesTipo, type MedioPago } from '../components/caja/BotonesTipo'
import { Teclado } from '../components/caja/Teclado'
import { Visor } from '../components/caja/Visor'
import { Cinta } from '../components/marca/Cinta'
import { formatearDiaCorto, formatearPesos } from '../lib/formato'
import { aplicarTecla, teclaDesdeTeclado, type Tecla } from '../lib/importe'

/**
 * Página de muestra de la Fase 0: tokens, tipografías y el bloque de carga de la caja.
 * No guarda nada; sirve para revisar el diseño en el celular antes de la Fase 1.
 */

const PALETA = [
  { nombre: 'Bordó', hex: '#511611', uso: 'Marca y Efectivo' },
  { nombre: 'Tinta', hex: '#261110', uso: 'Texto y fondo oscuro' },
  { nombre: 'Azulejo', hex: '#FAF9F9', uso: 'Fondo claro' },
  { nombre: 'Pizarra', hex: '#2E4A5A', uso: 'Digital' },
  { nombre: 'Fósforo', hex: '#7CF5C8', uso: 'Solo el visor' },
  { nombre: 'Alerta', hex: '#D9432B', uso: 'Errores y Cerrar el día' },
]

type Tema = 'sistema' | 'claro' | 'oscuro'

function useTema(): [Tema, (t: Tema) => void] {
  const [tema, setTema] = useState<Tema>('sistema')
  useEffect(() => {
    const raiz = document.documentElement
    if (tema === 'sistema') raiz.removeAttribute('data-tema')
    else raiz.setAttribute('data-tema', tema)
  }, [tema])
  return [tema, setTema]
}

export function Estilo() {
  const [importe, setImporte] = useState(0)
  const [total, setTotal] = useState(284500)
  const [ventas, setVentas] = useState(37)
  const [aviso, setAviso] = useState<string | null>(null)
  const [tema, setTema] = useTema()
  const temporizador = useRef<number | undefined>(undefined)

  const tocar = (tecla: Tecla) => setImporte((actual) => aplicarTecla(actual, tecla))

  const guardar = (medio: MedioPago) => {
    if (importe <= 0) return
    navigator.vibrate?.(30)
    setTotal((t) => t + importe)
    setVentas((v) => v + 1)
    setAviso(
      `Guardada · ${medio === 'efectivo' ? 'Efectivo' : 'Digital'} ${formatearPesos(importe, { sinCentavos: true })}`,
    )
    setImporte(0)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setAviso(null), 4000)
  }

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return
      const tecla = teclaDesdeTeclado(e.key)
      if (tecla) setImporte((actual) => aplicarTecla(actual, tecla))
      else if (e.key === 'Escape') setImporte(0)
    }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="pt-4">
        <Cinta>
          <div className="flex items-center justify-between gap-3">
            <span className="font-cartel text-2xl font-extrabold tracking-wide uppercase">
              Avícola GD
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span>{formatearDiaCorto(new Date())}</span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-fosforo" aria-hidden="true" />
                Abierta
              </span>
            </span>
          </div>
        </Cinta>
        <p className="mt-3 flex items-baseline justify-between px-1 lg:max-w-[26rem]">
          <span className="text-suave">Hoy llevás</span>
          <span className="text-3xl font-bold cifras">
            {formatearPesos(total, { sinCentavos: true })}
          </span>
          <span className="text-suave cifras">{ventas} ventas</span>
        </p>
      </header>

      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <section aria-labelledby="titulo-carga" className="flex flex-col gap-4">
          <h2 id="titulo-carga" className="sr-only">
            Cargar una venta
          </h2>
          <Visor importe={importe} />
          <Teclado onTecla={tocar} />
          <BotonesTipo habilitado={importe > 0} onGuardar={guardar} />
          <div
            role="status"
            className="min-h-12 rounded-xl border border-borde bg-superficie px-4 py-3 text-center"
          >
            {aviso ?? <span className="text-suave">Acá vas a ver la última venta guardada</span>}
          </div>
        </section>

        <section aria-labelledby="titulo-estilo" className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="titulo-estilo" className="font-cartel text-4xl font-extrabold uppercase">
              Guía de estilo
            </h2>
            <fieldset className="flex rounded-xl border border-borde p-1">
              <legend className="sr-only">Tema</legend>
              {(['sistema', 'claro', 'oscuro'] as const).map((t) => (
                <label
                  key={t}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm capitalize has-checked:bg-marca has-checked:text-sobre-marca"
                >
                  <input
                    type="radio"
                    name="tema"
                    className="sr-only"
                    checked={tema === t}
                    onChange={() => setTema(t)}
                  />
                  {t}
                </label>
              ))}
            </fieldset>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold tracking-wide text-suave uppercase">Paleta</h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PALETA.map((c) => (
                <li key={c.nombre} className="overflow-hidden rounded-xl border border-borde">
                  <div className="h-16" style={{ background: c.hex }} />
                  <div className="bg-superficie px-3 py-2 text-sm">
                    <div className="font-bold">{c.nombre}</div>
                    <div className="text-suave cifras">{c.hex}</div>
                    <div className="text-suave">{c.uso}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="mb-1 text-sm font-bold tracking-wide text-suave uppercase">
              Tipografías
            </h3>
            <p className="font-cartel text-5xl font-extrabold uppercase">Cerrar el día</p>
            <p className="text-sm text-suave">
              Big Shoulders Display: títulos y rótulos, con mesura
            </p>
            <p className="text-lg">
              Vas a cerrar el día. Después no se puede modificar sin un administrador.
            </p>
            <p className="text-2xl font-bold cifras">
              {formatearPesos(1234567.89)} · {formatearPesos(8300)}
            </p>
            <p className="text-sm text-suave">
              Atkinson Hyperlegible Next: texto y montos (cifras tabulares)
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="mb-1 text-sm font-bold tracking-wide text-suave uppercase">Estados</h3>
            <p className="font-bold text-ok">✓ La caja coincide: diferencia $ 0</p>
            <p className="font-bold text-aviso">▲ Sobran $ 1.200 en la caja</p>
            <p role="alert" className="rounded-xl bg-alerta px-4 py-3 font-bold text-white">
              Sin internet: esta venta NO se guardó. Revisá la conexión y tocá de nuevo.
            </p>
            <button
              type="button"
              className="self-start py-3 font-bold text-alerta-texto underline-offset-4 hover:underline"
            >
              Cerrar el día →
            </button>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold tracking-wide text-suave uppercase">Logo</h3>
            <div className="max-w-sm rounded-2xl bg-white p-6">
              <img src={logo} alt="Gonza — Carnicería, Chanchería, Avícola" className="w-full" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
